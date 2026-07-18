import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Cadastro de marcas', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);    

    await page.waitForTimeout(2000);           
    const salvarMarcaPromise = page.waitForResponse((response) =>
    response.url().includes('/api/marca') &&
    ['POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300);
 
    const cadBtn = page.getByText(/cadastros/i).first();
    await expect(cadBtn).toBeVisible();
    await cadBtn.click();
    console.log('✅ Clicou em Cadastros');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/marcas"]').click()
    console.log('✅ Clicou em Marcas'); 

    const btnCadastrar = page.getByText(/cadastrar marca/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });
    console.log('✅ Clicou em Cadastrar Marca');    

    console.log('***DADOS ENVIADOS PRA API***');
    const marca = `MARCA ADIDAS ${Date.now()}`;
    await page.getByLabel(/cadastrar nova marca/i).fill(marca);
    console.log('✅ Nome da Marca:', marca.toUpperCase());     
    console.log('FIM DE DADOS ENVIADOS');      

    await page.locator('.q-btn')
    .filter({ hasText: /confirmar|guardar/i })
    .click({ force: true });
    console.log('CLICOU EM SALVAR MARCA');  

    const salvarUrlResponse = await salvarMarcaPromise;     
    const urlCompletaPost = salvarUrlResponse.url();
    console.log('🌐 A URL capturada do POST é:', urlCompletaPost);

    const salvarPessoaResponse = await salvarMarcaPromise;
    const dadosSalvos = await salvarPessoaResponse.json();
    console.log('✅ DADOS RETORNADOS NA CRIAÇÃO');
    console.log(JSON.stringify(dadosSalvos, null, 2));
    
    const idMarca = dadosSalvos.controle.toString().trim();    
    const urlRegistroCriado = `${urlCompletaPost}/${idMarca}`;                
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
    console.log('✅ Novo Controle:', idMarca);            
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