import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de Cadastro de DAV', async ({ page }) => {    
    test.setTimeout(60000); 

    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);       
    
    const salvarDavPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/venda') &&
    ['POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300
  );
    
    const venBtn = page.getByText(/vendas/i).first();
    await expect(venBtn).toBeVisible();
    await venBtn.click();
    console.log('CLICOU EM VENDAS');
  
    await Promise.all([
      page.waitForURL(/dav/, { timeout: 15000 }),
      page.locator('a[href*="dav"]').first().click()
    ]);
    console.log('✅ Clicou em DAV');
    
    const btnCadastrar = page.getByText(/cadastrar dav/i).first();
    await btnCadastrar.waitFor({ state: 'visible' });
    await btnCadastrar.click({ force: true });
    console.log('✅ Clicou em Cadastrar DAV');   

    console.log('DADOS ENVIADOS PRA API');
   
    const davField = page.locator('[aria-label="Tipo de DAV"]').first();
    await davField.scrollIntoViewIfNeeded();
    await expect(davField).toBeVisible();    
    await davField.evaluate(el => (el as HTMLElement).click());    
    const menu = page.locator('.q-menu');
    await expect(menu).toBeVisible();    
    const davse = ['pedido de venda', 'orçamento'];    
    const davEscolhida = davse[Math.floor(Math.random() * davse.length)];    
    const opcao = menu.locator('.q-item', {
    hasText: new RegExp(davEscolhida, 'i')
    }).first();
    await opcao.click();
    console.log('✅ DAV Selecionada:', davEscolhida.toUpperCase()); 

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataISO = `${dia}-${mes}-${ano}`;
    
    const inputValidade = page.getByLabel(/validade do orçamento|previsão da entrega/i);
    await inputValidade.waitFor({ state: 'visible' });
    await inputValidade.fill(dataISO);
    if(davEscolhida=='orçamento')
    console.log('✅ Data de Validade:', dataISO);
    else
    console.log('✅ Previssão da Entrega:', dataISO);

    const botaoItens = page.locator('xpath=//button[.//i[normalize-space(.)="format_list_bulleted"]]').first();
    await botaoItens.waitFor({ state: 'visible' });
    await botaoItens.click({ force: true });
    console.log('✅ Clicou em Itens da DAV');  
    
    await page.getByText('Seleção de produto(s)').waitFor({ state: 'visible' });
    const ativos = page.getByText('Ativo', { exact: true });
    
    await ativos.nth(0).waitFor({ state: 'visible' });
    await ativos.nth(0).click({ force: true });
    await ativos.nth(1).click({ force: true });
    await ativos.nth(2).click({ force: true });
    await ativos.nth(3).click({ force: true });
    console.log('✅ Selecionou vários itens das DAV');  
    
    const btnAdicionar = page.locator('.q-btn').filter({ hasText: /adicionar/i });
    await btnAdicionar.waitFor({ state: 'visible' });
    await btnAdicionar.click({ force: true });
    console.log('✅ Clicou em Adicionar');  
    console.log('FIM DE DADOS ENVIADOS PRA API');
    
    const salvar = page.locator('button.q-btn').filter({ hasText: 'SALVAR' }).first();
    await salvar.waitFor({ state: 'visible' });
    console.log('✅ Clicou em Salvar');

    console.log('✅ ENVIANDO DADOS E AGUARDANDO RETORNO DA API');
    
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

    const salvarDavResponse = await salvarDavPromise;
    const dadosSalvos = await salvarDavResponse.json();
    console.log('✅ DADOS RETORNADOS NA CRIAÇÃO');
    console.log(JSON.stringify(dadosSalvos, null, 2));
   
    const dadosTratados = await respostaSalvar.json();
    console.log('✅ REQUISIÇÃO CAPTURADA COM SUCESSO!');    
    
    let idDav = '';
    if (dadosTratados.venda && dadosTratados.venda.controle) {
        idDav = dadosTratados.venda.controle.toString().trim();
    } else if (dadosTratados.data && dadosTratados.data[0] && dadosTratados.data[0].controle) {
        idDav = dadosTratados.data[0].controle.toString().trim();
    } else if (dadosTratados[0] && dadosTratados[0].controle) {
        idDav = dadosTratados[0].controle.toString().trim();
    }

    if (!idDav) {
        throw new Error('Não foi possível extrair o ID de "controle" da resposta da API.');
    }    
    
    const urlRegistroCriado = urlCompletaPost.replace('/geral', `/${idDav}`);
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
    console.log('🌐 A URL do registro criado é:', urlRegistroCriado);
    console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO');
    console.log('✅ Novo Controle:', idDav);        
    console.log(`✅ Status: ${getCriadoResponse.status()}`);

    try {
      const dadosCriado = await getCriadoResponse.json();
      console.log(JSON.stringify(dadosCriado, null, 2));
      expect(getCriadoResponse.status()).toBe(200);
    } catch (error) {
      console.error('Erro ao converter resposta para JSON:', error);
      const corpoBruto = await getCriadoResponse.text();
      console.log('Corpo bruto da resposta:', corpoBruto);
    }
});