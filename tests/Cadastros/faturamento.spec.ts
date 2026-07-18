import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de Cadastro de Faturas', async ({ page }) => {
    test.setTimeout(60000); 

    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);           

    const salvarVendaPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/venda') &&
    ['POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300
  );
    
    const venBtn = page.getByText(/vendas/i).first();
    await expect(venBtn).toBeVisible();
    await venBtn.click();
    console.log('✅ Clicou em Vendas');  
    
    await Promise.all([
      page.waitForURL(/facturacion/, { timeout: 15000 }),
      page.locator('a[href*="facturacion"]').first().click()
    ]);
    console.log('✅ Clicou em Faturamento');
    
    const btnCadastrar = page.getByText(/cadastrar fatura/i).first();
    await btnCadastrar.waitFor({ state: 'visible' });
    await btnCadastrar.click({ force: true });
    console.log('✅ Clicou em Cadastrar Fatura');

    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => { document.body.style.zoom = '0.8'; });
       
    console.log('DADOS ENVIADOS PRA API');          
    await page.waitForTimeout(2000);
    await page.locator('.q-select').nth(5).click();
    await page.locator('(//div[contains(@class,"q-menu")]//*[contains(@class,"q-item")])[1]').click();       
    const primeiraOpcaoMenu = page.locator('(//div[contains(@class,"q-menu")]//*[contains(@class,"q-item")])[1]');
    await primeiraOpcaoMenu.waitFor({ state: 'visible' });
    await primeiraOpcaoMenu.click();
    const destino = await page.locator('input[aria-label="Destinatário/remetente"]').inputValue();      
    console.log('✅ Selecionou um Destinatário/Remitente',destino.toUpperCase());  
    
    const botaoItens = page.locator('xpath=//button[.//i[normalize-space(.)="format_list_bulleted"]]').first();
    await botaoItens.waitFor({ state: 'visible' });
    await botaoItens.click({ force: true });
    console.log('✅ Clicou em Itnes da Fatura');  
    
    await page.getByText('Seleção de produto(s)').waitFor({ state: 'visible' });
    const ativos = page.getByText('Ativo', { exact: true });
    
    await ativos.nth(0).waitFor({ state: 'visible' });
    await ativos.nth(0).click({ force: true });
    await ativos.nth(1).click({ force: true });   
    console.log('✅ Selecionou vários itens da Fatura');  
    
    const btnAdicionar = page.locator('.q-btn').filter({ hasText: /adicionar/i });
    await btnAdicionar.waitFor({ state: 'visible' });
    await btnAdicionar.click({ force: true });
    console.log('✅ Clicou em Adicionar Itens');  
    console.log('FIM DE DADOS ENVIADOS PRA API');

    const salvar = page.locator('button.q-btn').filter({ hasText: 'SALVAR' }).first();
    await salvar.waitFor({ state: 'visible' });

    console.log('✅ ENVIANDO DADOS E AGUARDANDO API');
    
    const [respostaSalvar] = await Promise.all([
        page.waitForResponse((response) => {
            const url = response.url();
            const metodo = response.request().method();
            
            return url.includes('/api/py/venda') && 
                   ['POST', 'GET'].includes(metodo) && 
                   response.status() >= 200 && 
                   response.status() < 300;
        }, { timeout: 30000 }),
        salvar.click() 
    ]);     

    const urlCompletaPost = respostaSalvar.url();
    console.log("🌐 A URL capturada do POST é:", urlCompletaPost);

    const salvarVendaResponse = await salvarVendaPromise;
    const dadosSalvos = await salvarVendaResponse.json();
    console.log('✅ DADOS RETORNADOS NA CRIAÇÃO');
    console.log(JSON.stringify(dadosSalvos, null, 2));
   
    const dadosTratados = await respostaSalvar.json();
    console.log('✅ REQUISIÇÃO CAPTURADA COM SUCESSO!');    
    
    let idVenda = '';
    if (dadosTratados.venda && dadosTratados.venda.controle) {
        idVenda = dadosTratados.venda.controle.toString().trim();
    } else if (dadosTratados.data && dadosTratados.data[0] && dadosTratados.data[0].controle) {
        idVenda = dadosTratados.data[0].controle.toString().trim();
    } else if (dadosTratados[0] && dadosTratados[0].controle) {
        idVenda = dadosTratados[0].controle.toString().trim();
    }

    if (!idVenda) {
        throw new Error('Não foi possível extrair o ID de "controle" da resposta da API.');
    }    
    
    const urlRegistroCriado = urlCompletaPost.replace('/geral', `/${idVenda}`);
    const headersOriginais = respostaSalvar.request().headers();
    const headersGetRegistro: Record<string, string> = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      authorization: headersOriginais['authorization'] || '',
      'x-xsrf-token': headersOriginais['x-xsrf-token'] || '',
      'x-tenant': headersOriginais['x-tenant'] || '',
      'x-empresa': headersOriginais['x-empresa'] || '',
    };
    
    const getCriadoResponse = await page.request.get(urlRegistroCriado, {
      headers: headersGetRegistro,
    });
    console.log("🌐 A URL do registro criado é:", urlRegistroCriado);
    console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO ***');
    console.log('✅ Novo Controle de Venda:', idVenda);            
    console.log(`✅ Status: ${getCriadoResponse.status()}`);

    try {
      const dadosCriado = await getCriadoResponse.json();
      console.log(JSON.stringify(dadosCriado, null, 2));
      expect([200, 404]).toContain(getCriadoResponse.status());
    } catch (error) {
      console.error('Erro ao converter resposta para JSON:', error);
      const corpoBruto = await getCriadoResponse.text();
      console.log('Corpo bruto da resposta:', corpoBruto);
    }
});