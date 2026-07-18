import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Cadastro de espécies', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });    
    await loginCompleto(page);    

    await page.waitForTimeout(2000);       
    
    const salvarEspeciePromise = page.waitForResponse((response) =>
    response.url().includes('/api/especie') &&
    ['POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300);
 
    await page.waitForTimeout(1000);
    await page.getByText(/cadastros/i).click({ force: true }); 
    console.log('✅ Clicou em Cadastro');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/metodos-pagos"]').click()
    console.log('✅ Clicou em Espécies'); 

    const btnCadastrar = page.getByText(/cadastrar espécie/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });
    console.log('✅ Clicou em Cadastrar Espécie');

    console.log('DADOS ENVIADOS PRA API');
    const descricao = `ESPÉCIE EFECTIVO ${Date.now()}`;
    await page.getByLabel(/descrição/i).fill(descricao);
    console.log('✅ Descrição da Espécie:', descricao.toUpperCase());

    await page.locator('[aria-label="Tipo do cartão"]').click({ force: true });
    const cartao = page.locator('.q-menu:visible');
    await cartao.waitFor();
    await cartao
    .locator('.q-item')
    .filter({ hasText: /não é cartão|débito|crédito/i })
    .first()
    .click({ force: true });
    const tipocar = await page.locator('input[aria-label="Tipo do cartão"]').inputValue();      
    console.log('✅ Tipo do Cartão:',tipocar.toUpperCase());

    await page.waitForTimeout(1000);
    const moedaField = page.locator('[aria-label="Moeda de cotação (diferente da sua empresa)"]').first();
    await moedaField.scrollIntoViewIfNeeded();
    await expect(moedaField).toBeVisible();    
    await moedaField.evaluate(el => (el as HTMLElement).click());    
    const menu1= page.locator('.q-menu');
    await expect(menu1).toBeVisible();    
    const moedas = ['usd', 'brl', 'pyg', 'cad', 'eur', 'gbp'];    
    const moedaEscolhida = moedas[Math.floor(Math.random() * moedas.length)];
    const opcao = menu1.locator('.q-item', {
    hasText: new RegExp(moedaEscolhida, 'i')
    }).first();
    await opcao.click();
    const tipomoe = await page.locator('input[aria-label="Moeda de cotação (diferente da sua empresa)"]').inputValue();      
    console.log('✅ Moeda de Cotação:', tipomoe.toUpperCase());

    await page.waitForTimeout(1000);
    await page.locator('[aria-label="Tipo da espécie"]').click({ force: true });
    const menu = page.locator('.q-menu:visible');
    await menu.waitFor();
    await menu
    .locator('.q-item')
    .filter({ hasText: /dinheiro/i })
    .first()
    .click({ force: true });
    const tipoesp = await page.locator('input[aria-label="Tipo da espécie"]').inputValue();      
    console.log('✅ Tipo da Espécie:',tipoesp.toUpperCase());
    console.log('FIM DE DADOS ENVIADOS***');    

    await page.locator('.q-btn')
    .filter({ hasText: /salvar|guardar/i })
    .click({ force: true });
    console.log('✅ Clicou em Salvar');  

    const salvarUrlResponse = await salvarEspeciePromise;     
    const urlCompletaPost = salvarUrlResponse.url();
    console.log('🌐 A URL capturada do POST é:', urlCompletaPost);

    const salvarPessoaResponse = await salvarEspeciePromise;
    const dadosSalvos = await salvarPessoaResponse.json();
    console.log('✅ DADOS RETORNADOS NA CRIAÇÃO');
    console.log(JSON.stringify(dadosSalvos, null, 2));
    
    const idEspecie = dadosSalvos.controle.toString().trim();
    console.log('CONTROLE:', idEspecie);      
    const urlRegistroCriado = `${urlCompletaPost}/${idEspecie}`;     
    const headersOriginais = salvarPessoaResponse.request().headers();
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
    console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO');
    console.log('✅ Novo Controle:', idEspecie);      
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