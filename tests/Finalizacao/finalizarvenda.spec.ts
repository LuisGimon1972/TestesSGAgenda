import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de Faturamento de Vendas', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);          

    
    await page.waitForTimeout(2000);        
    const venBtn = page.getByText(/vendas/i).first();
    await expect(venBtn).toBeVisible();
    await venBtn.click();
    console.log('CLICOU EM VENDAS');
  
    await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForURL(/facturacion/, { timeout: 15000 }),
      page.locator('a[href*="facturacion"]').first().click()
    ]);
    console.log('CLICOU EM FATURAMENTO');

    await page.waitForSelector('button:has-text("Aberta")', { state: 'visible', timeout: 10000 });
    await page.locator('button:has-text("Aberta")').click();
    console.log('FILTROU FATURAS ABERTAS');

    await page.waitForTimeout(1000);
    const editIcons = await page.locator('table img[src="/icons/edit.svg"]').count();
    console.log('QUANTIDADE DE REGISTROS NA GRADE:', editIcons.toString().trim());

    if (editIcons === 0) {
        console.log('NENHUM REGISTRO ENCONTRADO NA GRADE, NADA PARA EDITAR.');
        return;
    }
    const getRegistroEditadoPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/venda') &&
    response.request().method() === 'GET' &&
    response.status() === 200 &&
    /\/api\/py\/venda\/[^/?]+/.test(response.url()));

    const getVendaPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/venda') &&
    response.request().method() === 'GET' &&
    response.status() === 200);  

    await page.locator('table img[src="/icons/edit.svg"]').first().click();
    console.log('CLICOU NO ÍCONE DE EDITAR');    

    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => {
    document.body.style.zoom = '0.8'; });
    console.log('🔍 Zoom ajustado para 80% via CSS');

    const getVendaResponsee = await getVendaPromise;
    const dadosAntes = await getVendaResponsee.json();
    console.log('*** DADOS DO REGISTRO NO BANCO (ANTES DA ALTERAÇÃO) ***');
    console.log(JSON.stringify(dadosAntes, null, 2));  

    const getRegistroEditadoResponse = await getRegistroEditadoPromise;
    const urlRegistroEditado = getRegistroEditadoResponse.url();
    const headersOriginais = getRegistroEditadoResponse.request().headers();

    console.log('URL DO REGISTRO EDITADO:', urlRegistroEditado);
   
    console.log('***DADOS ENVIADOS PRA API***');  
    await page.waitForTimeout(2000);
    await page.locator('.q-select').nth(5).click();
    await page.locator('(//div[contains(@class,"q-menu")]//*[contains(@class,"q-item")])[1]').click();
    const remetente = await page.locator('input[aria-label="Destinatário/remetente"]').inputValue();
    console.log('SELECIONOU UM DESTINATÁRIO/REMITENTE OK:',remetente);  

    const salvarVendaPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/venda') &&
    ['PUT', 'PATCH', 'POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300
  );

    await page.waitForTimeout(2000);     
    const finalizar = page
    .locator('button.q-btn')
    .filter({ hasText: 'FINALIZAR' });
    await finalizar.first().waitFor({ state: 'visible' });
    await finalizar.first().click({ force: true });   

    await page.waitForTimeout(1000);     

     const saldoTexto = await page
    .locator('text=Saldo venda')
    .locator('xpath=following::*[contains(text(),"Gs")][1]')
    .innerText();

    const saldo = Number(
      saldoTexto
        .replace('Gs', '')
        .trim()
        .replace(/\./g, '')
        .replace(',', '.')
    )/100;
    console.log('TOTAL DE VENDAS:',saldo.toString().trim()); 

    const valor = saldo;    
    const valorEfectivo = calcularEfectivo(valor)
    const troco = valorEfectivo - valor
    const efectivo = page.locator('.payment-specie-row', {
      hasText: 'EFECTIVO'
    });
    await efectivo.locator('input').fill(valorEfectivo.toString());
    console.log('DIGITOU VALOR EM EFECTIVO:',valorEfectivo.toString()); 
    console.log('CALCULOU TROCO:',troco.toString()); 

   

    const confirmar = page
    .locator('button.q-btn')
    .filter({ hasText: 'CONFIRMAR' });
    await confirmar.first().waitFor({ state: 'visible' });
    await confirmar.first().click({ force: true });           
    console.log('CLICLOU EM CONFIRMAR VENDA'); 

      await salvarVendaPromise;

  const headersGetRegistro: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (headersOriginais.authorization) {
    headersGetRegistro.authorization = headersOriginais.authorization;
  }
  if (headersOriginais['x-xsrf-token']) {
    headersGetRegistro['x-xsrf-token'] = headersOriginais['x-xsrf-token'];
  }
  if (headersOriginais['x-tenant']) {
    headersGetRegistro['x-tenant'] = headersOriginais['x-tenant'];
  }
  if (headersOriginais['x-empresa']) {
    headersGetRegistro['x-empresa'] = headersOriginais['x-empresa'];
  }
  const getVendaResponse = await page.request.get(urlRegistroEditado, {
    headers: headersGetRegistro,
  });
  console.log(`STATUS GET REGISTRO EDITADO: ${String(getVendaResponse.status())}`);
  const textoResposta = await getVendaResponse.text();
  if (!getVendaResponse.ok()) {
    throw new Error(`GET registro editado falhou: ${getVendaResponse.status()} - ${textoResposta}`);
  }
  const dadosDepois = JSON.parse(textoResposta);
  console.log('***DADOS APÓS DA ALTERAÇÃO (GET DO REGISTRO EDITADO)***');
  console.log(JSON.stringify(dadosDepois, null, 2));

    function calcularEfectivo(total: number): number {
    return Math.ceil(total / 10) * 10;
}
});