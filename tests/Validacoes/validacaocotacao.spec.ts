import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Validação de cotação', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);    
 
    const cadBtn = page.getByText(/cadastros/i).first();
    await expect(cadBtn).toBeVisible();
    await cadBtn.click();
    console.log('CLICOU EM CADASTRO');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/cotizacion-monedas"]').click()
    console.log('CLICOU EM COTAÇÃO'); 

    const btnCadastrar = page.getByText(/cadastrar cotação/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });
    console.log('CLICOU CADASTRAR COTAÇÃO');    
    
    const moedaField = page.locator('[aria-label="Moeda de cotação (diferente da sua empresa)"]').first();
    await moedaField.scrollIntoViewIfNeeded();
    await expect(moedaField).toBeVisible();    
    await moedaField.evaluate(el => (el as HTMLElement).click());    
    const menu = page.locator('.q-menu');
    await expect(menu).toBeVisible();    
    const moedas = ['usd', 'brl', 'pyg', 'cad', 'eur', 'gbp'];    
    const moedaEscolhida = moedas[Math.floor(Math.random() * moedas.length)];
    
    const opcao = menu.locator('.q-item', {
    hasText: new RegExp(moedaEscolhida, 'i')
    }).first();
    await opcao.click();
    console.log('MOEDA DE COTAÇÃO OK:', moedaEscolhida);

    const venta = '0';
    const inputVenta = page.getByLabel(/valor de venda/i);
    await expect(inputVenta).toBeVisible();
    await inputVenta.fill(String(venta));
    console.log('VALOR DE VENTA ZERADO OK', venta);
    
    console.log('VALOR DE COMPRA VAZIO OK');

    const hoje = new Date();
    const datahoje = hoje.toLocaleDateString('pt-BR');
    const inputData = page
    .locator('.q-field')
    .filter({ hasText: /vig[eê]ncia/i })
    .first()
    .locator('input');
    await expect(inputData).toBeVisible();
    await inputData.fill(datahoje);
    console.log('INICIO DE VIGÊNCIA OK', datahoje);    
    
    console.log('FIM DE VIGÊNCIA VAZIO OK');

    await page.locator('.q-btn')
    .filter({ hasText: /salvar|guardar/i })
    .click({ force: true });
    console.log('CLICOU EM SALVAR COTACAO');  

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});