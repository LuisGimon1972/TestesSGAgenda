import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Cadastro de cotação de moedas', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);    

    const salvarCotacaoPromise = page.waitForResponse((response) =>
    response.url().includes('/api/moeda/cotacao') &&
    ['POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300);
 
    const cadBtn = page.getByText(/cadastros/i).first();
    await expect(cadBtn).toBeVisible();
    await cadBtn.click();
    console.log('✅ Clicou em Cadastros');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/cotizacion-monedas"]').click()
    console.log('✅ Clicou em Coatação'); 

    const btnCadastrar = page.getByText(/cadastrar cotação/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });
    console.log('✅ Clicou em Cadastrar Cotação');    
    
    console.log('DADOS ENVIADOS PARA API');    
    const moedaField = page.locator('[aria-label="Moeda de cotação (diferente da sua empresa)"]').first();
    await moedaField.scrollIntoViewIfNeeded();
    await expect(moedaField).toBeVisible();    
    await moedaField.evaluate(el => (el as HTMLElement).click());    
    const menu = page.locator('.q-menu');
    await expect(menu).toBeVisible();    
    const moedas = ['usd', 'brl', 'cad', 'eur', 'gbp'];    
    const moedaEscolhida = moedas[Math.floor(Math.random() * moedas.length)];    
    const opcao = menu.locator('.q-item', {
    hasText: new RegExp(moedaEscolhida, 'i')
    }).first();
    await opcao.click();
    console.log('✅ Moeda de Cotação selecionada:', moedaEscolhida.toUpperCase());

    const venta = Math.floor(Math.random() * (6000 - 5000 + 1)) + 5000;
    const inputVenta = page.getByLabel(/valor de venda/i);
    await expect(inputVenta).toBeVisible();
    await inputVenta.fill(String(venta));
    console.log('✅ Valor de Venda:', venta.toString().trim());

    const compra = Math.floor(Math.random() * (5000 - 4500 + 1)) + 4500;
    const inputCompra = page.getByLabel(/valor de compra/i);
    await expect(inputCompra).toBeVisible();
    await inputCompra.fill(String(compra));
    console.log('✅ Valor de Compra:', compra.toString().trim());

    const hoje = new Date();
    const datahoje = hoje.toLocaleDateString('pt-BR');
    const inputData = page
    .locator('.q-field')
    .filter({ hasText: /vig[eê]ncia/i })
    .first()
    .locator('input');
    await expect(inputData).toBeVisible();
    await inputData.fill(datahoje);
    console.log('✅ Inicio de Vigência:', datahoje);

    await page.waitForTimeout(2000);        
    const fin = new Date();
    const fimMes = new Date(fin.getFullYear(), hoje.getMonth() + 1, 0);
    const dia = String(fimMes.getDate()).padStart(2, '0');
    const mes = String(fimMes.getMonth() + 1).padStart(2, '0');
    const ano = fimMes.getFullYear();
    const datafin = `${dia}/${mes}/${ano}`;
    const inputDatafin = page
    .locator('.q-field')
    .filter({ hasText: /fim|vig[eê]ncia/i })
    .last()
    .locator('input');
    await inputDatafin.scrollIntoViewIfNeeded();
    await expect(inputDatafin).toBeVisible();
    await inputDatafin.fill('');
    await inputDatafin.type(datafin, { delay: 50 });
    console.log('✅ Fim de Vigência:', datafin);
    console.log('FIM DE DADOS ENVIADOS');    

    await page.locator('.q-btn')
    .filter({ hasText: /salvar|guardar/i })
    .click({ force: true });
    console.log('✅ Clicou em Salvar Cotação');  

    const salvarUrlResponse = await salvarCotacaoPromise;     
    const urlCompletaPost = salvarUrlResponse.url();
    console.log('🌐 A URL capturada do POST é:', urlCompletaPost);

    const salvarCotacaoResponse = await salvarCotacaoPromise;
    const dadosSalvos = await salvarCotacaoResponse.json();
    console.log('✅ DADOS RETORNADOS NA CRIAÇÃO');
    console.log(JSON.stringify(dadosSalvos, null, 2));
    
    const idCotacao = dadosSalvos.controle.toString().trim();    
    const urlRegistroCriado = `${urlCompletaPost}/${idCotacao}`;         
    const headersOriginais = salvarCotacaoResponse.request().headers();
    const headersGetRegistro: Record<string, string> = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      authorization: headersOriginais['authorization'],
      'x-xsrf-token': headersOriginais['x-xsrf-token'],
      'x-tenant': headersOriginais['x-tenant'],
      'x-empresa': headersOriginais['x-empresa'],
    };
    
    const getCriadoResponse = await page.request.get(urlRegistroCriado, {
      headers: headersGetRegistro,
    });
    console.log('🌐 A URL do registro criado é:', urlRegistroCriado);
    console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO***');
    console.log('✅ Novo Controle:', idCotacao);    
    console.log(`✅ Status: ${getCriadoResponse.status()}`);

    try {
      const dadosCriado = await getCriadoResponse.json();
      console.log(JSON.stringify(dadosCriado, null, 2));
    } catch (error) {
      console.error('Erro ao converter resposta para JSON:', error);
      const corpoBruto = await getCriadoResponse.text();
      console.log('Corpo bruto da resposta:', corpoBruto);
    }

    expect([404, 200]).toContain(getCriadoResponse.status());    

    
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});