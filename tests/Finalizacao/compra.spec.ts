import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de Faturamento de Compras', async ({ page }) => {

    test.setTimeout(60000); 
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);      

    const salvarCompraPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/compra') &&
    ['POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300
  );
    
    await page.waitForTimeout(2000);               
    const comprasBtn = page.getByText(/compras/i).first();
    await expect(comprasBtn).toBeVisible({ timeout: 5000 });
    await comprasBtn.click();
    console.log('✅ Clicou em Compras');    

    const btnCadastrar = page.getByText(/cadastrar compra/i).first();
    await btnCadastrar.click();
    console.log('✅ Clicou em Cadastrar Compra');
    
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => { document.body.style.zoom = '0.8'; });
   
    await page.waitForTimeout(2000);    
    console.log('DADOS ENVIADOS PRA API');
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataISO = `${dia}-${mes}-${ano}`;
    
    await page.getByLabel(/data emissão/i).fill(dataISO);
    console.log('✅ Data de Emissão:', dataISO);

    await page.waitForTimeout(2000);
    await page.getByLabel(/data de recebimento/i).fill(dataISO);
    console.log('✅ Data de Recebimento:', dataISO);

    const numeroNota = Math.floor(Math.random() * 1000) + 1;
    const campoNumero = page.locator('.q-field').filter({ hasText: /n° nota/i }).last();
    await campoNumero.locator('input').fill(numeroNota.toString());
    console.log('✅ Número da Nota:', numeroNota.toString().trim());    
    
    await page.locator('.q-select').nth(0).click();
    await page.locator('.q-menu .q-item').first().click();
    const fornecedor = await page.locator('input[aria-label="Fornecedor"]').inputValue();
    console.log('✅ Fornecedor:', fornecedor.toUpperCase());          
    
    const botaoItens = page.locator('button').filter({ has: page.locator('i:text("format_list_bulleted")') }).first();
    await botaoItens.click();
    console.log('✅ Clicou em Itens da Compra');      
    
    await page.getByText('Seleção de produto(s)').waitFor({ state: 'visible' });
    const ativos = page.getByText('Ativo', { exact: true });
    await ativos.nth(0).click();
    await ativos.nth(1).click();
    await ativos.nth(2).click();    
    console.log('✅ Selecionou vários itens da compra');  

    await page.waitForTimeout(3000);

    await page.locator('.q-btn').filter({ hasText: /adicionar/i }).click({ force: true });
    console.log('✅ Clicou em Adicionar Itens'); 
    console.log('FIM DE DADOS ENVIADOS PRA API');

    await page.waitForTimeout(2000);
    const salvar = page.locator('button.q-btn').filter({ hasText: 'SALVAR' });
    await salvar.first().waitFor({ state: 'visible' });
    await salvar.first().click({ force: true });         
    console.log('✅ Clicou em Salvar Itens');  

    await page.waitForTimeout(2000);
    const salvar2 = page.locator('button.q-btn').filter({ hasText: 'SALVAR' });
    await salvar2.first().waitFor({ state: 'visible' });
    await salvar2.first().click({ force: true });         
    console.log('✅ Clicou em Salvar Compra');        
    
    const modal1 = page.locator('.q-dialog:visible').first();
    await modal1.waitFor({ state: 'visible', timeout: 15000 });    
    const btnConfirmar1 = modal1.locator('.q-btn', { hasText: /confirmar|salvar/i }).first();   
    await btnConfirmar1.waitFor({ state: 'visible', timeout: 5000 });   
    await page.waitForTimeout(500);    
    await btnConfirmar1.click({ force: true });
    console.log('✅ Clicou em Confirmar Totais');    
    
    await modal1.waitFor({ state: 'hidden', timeout: 10000 });
    await page.waitForTimeout(800); 
    
    const modal2 = page.locator('.q-dialog:visible').first();
    await modal2.waitFor({ state: 'visible', timeout: 15000 });
    const btnConfirmar2 = modal2.locator('.q-btn', { hasText: /confirmar|salvar/i }).first();
    await btnConfirmar2.waitFor({ state: 'visible', timeout: 5000 });    
    await btnConfirmar2.click({ force: true });
    console.log('✅ Clicou em Confirmar fórmula de preço');       
    await page.waitForTimeout(800); 

    const modal3 = page.locator('.q-dialog:visible').first();
    await modal3.waitFor({ state: 'visible', timeout: 15000 });    
    const btnConfirmar3 = modal3.locator('.q-btn', { hasText: /confirmar|salvar/i }).first();   
    await btnConfirmar3.waitFor({ state: 'visible', timeout: 5000 });   
    await page.waitForTimeout(500);    
    await btnConfirmar3.click({ force: true });    
    console.log('✅ Clicou em Confirmar Factura de Compra');       

    console.log('✅ ENVIANDO COMPRA E AGUARDANDO RETORNO DA API');    
    
    const [respostaSalvar] = await Promise.all([
        page.waitForResponse((response) => {
            const url = response.url();
            const metodo = response.request().method();
            
            return url.includes('/api/py/compra') && 
                   ['POST', 'GET'].includes(metodo) && 
                   response.status() >= 200 && 
                   response.status() < 300;
        }, { timeout: 30000 }),
        btnConfirmar2.click({ force: true })
    ]);    
    
    const dadosTratados = await respostaSalvar.json();
    console.log('✅ REQUISIÇÃO CAPTURADA COM SUCESSO!');          
    

    const salvarUrlResponse = await salvarCompraPromise;     
    const urlCompletaPost = salvarUrlResponse.url();
    console.log('🌐 A URL capturada do POST é:', urlCompletaPost);

    const salvarCompraResponse = await salvarCompraPromise;
    const dadosSalvos = await salvarCompraResponse.json();
    console.log('✅ DADOS RETORNADOS NA CRIAÇÃO');
    console.log(JSON.stringify(dadosSalvos, null, 2));   
        
    const idShoppng = dadosSalvos.compra.controle.toString().trim();        
    const urlRegistroCriado = urlCompletaPost.replace('/geral', `/${idShoppng}`);
    const headersOriginais = respostaSalvar.request().headers();
    const headersGetRegistro = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      authorization: headersOriginais['authorization'] || '',
      'x-xsrf-token': headersOriginais['x-xsrf-token'] || '',
      'x-tenant': headersOriginais['x-tenant'] || '',
      'x-empresa': headersOriginais['x-empresa'] || '',
    };
    
    console.log('🌐 A URL do registro criado é:', urlRegistroCriado);    
    
    const getCriadoResponse = await page.request.get(urlRegistroCriado, {
      headers: headersGetRegistro,
    });

    console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO DE COMPRA ***');
    console.log('✅ Novo controle de Compra:', idShoppng);    
    console.log(`✅ Status: ${getCriadoResponse.status()}`);

    try {
      const dadosCriado = await getCriadoResponse.json();
      console.log(JSON.stringify(dadosCriado, null, 2));
      expect(getCriadoResponse.status()).toBe(200);
    } catch (error) {
      console.error('Erro ao converter resposta de compra para JSON:', error);
      const corpoBruto = await getCriadoResponse.text();
      console.log('Corpo bruto da resposta:', corpoBruto);
    }
});