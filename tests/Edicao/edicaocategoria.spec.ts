import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { obterServicoAleatorio } from '../../utils/listaservicos';

test.describe('Teste de Edição de Categorias', () => {

  async function fecharCookiesSeAparecer(page: Page) {
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (/Entendi|Aceitar|Aceito|OK|Concordo/i.test(bodyText)) {
      const btnCookies = page.getByText(/Entendi/i).first();
      if (await btnCookies.isVisible().catch(() => false)) {
        await btnCookies.click({ force: true, timeout: 5000 }).catch(() => {});
        console.log('✅ Fechou aviso de cookies');
      }
    }
  }

  test.beforeEach(async ({ page }) => {
    await loginCompleto(page);    
    await fecharCookiesSeAparecer(page);    

    await page.waitForTimeout(2000);               
    await page.locator('.q-item, a, button').filter({ hasText: /Categorias/i }).first().click({ force: true });
    console.log(`✅ Clicou em Categorias`);          
    
    await page.waitForTimeout(500);       

    await expect(page.getByText(/Listagem de categorias/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('Deve selecionar aleatoriamente um categoria da lista e abrir edição.', async ({ page }) => {   
    
    const linhas = page.locator('tbody tr');

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 serviço').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const nomeCategorie = (await linhaSelecionada.locator('td').first().innerText()).trim();
    console.log(`✅ Categoria selecionada: ${nomeCategorie}`);    
    
    const btnEditar = linhaSelecionada
      .locator('button, a, i, .q-btn, .material-icons')
      .filter({ hasText: /edit/i })
      .first();
    
    await btnEditar.scrollIntoViewIfNeeded();
    await btnEditar.click({ force: true });    

    await page.waitForTimeout(1000); 
    
    const salvarCategoriaPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/categories') || response.url().includes('/categorias') || response.url().includes('/categories')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
    ).catch(() => null);
    
    const timestamp = Date.now();
    const nomeCategoria = obterServicoAleatorio().categoria + ' ' + timestamp;
    const descricao = `Categoria aplicando procedimentos voltados aos cuidados e à estética masculina, como cortes de cabelo, barba, bigode, acabamento, tratamentos capilares e outros serviços relacionados, realizados por profissionais.`;    
    
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
      try {
        const campo = page.locator('input:visible').nth(index);       
        
        await campo.waitFor({ state: 'visible', timeout: 10000 });                              
        await campo.clear();        
        await page.waitForTimeout(100);
        
        if (texto) {        
          await campo.fill(texto); 
        }        
          console.log(`✅ ${nomeCampo}: ${texto}`);         
                
      } catch (e) {
        console.error(`❌ Falha ao tentar preencher o campo: ${nomeCampo}`, e);
      }
    };
    
    await preencherCampo(0, nomeCategoria, 'Nome de Categoria Alterada');    
    
    await page.locator('.q-select').nth(0).click();    
    const primeiraOpcaoMenu = page.locator('(//div[contains(@class,"q-menu")]//*[contains(@class,"q-item")])[1]');
    await primeiraOpcaoMenu.waitFor({ state: 'visible', timeout: 5000 });    
    const nomeOpcaoSelecionada = await primeiraOpcaoMenu.innerText();
    await primeiraOpcaoMenu.click();       
    console.log('✅ Selecionou uma Categoria Pai:', nomeOpcaoSelecionada.trim().toUpperCase());      
    
    const campoDescricao = page.locator('textarea:visible').first();
    await campoDescricao.scrollIntoViewIfNeeded();
    await campoDescricao.click({ force: true });
    await campoDescricao.fill(descricao.toUpperCase(), { force: true });
    console.log('✅ Descrição do Serviço Alterada:', descricao.toUpperCase());

    await page.waitForTimeout(500);       

    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');                 

    let respostaJson: any = null;
    const salvarResponse = await salvarCategoriaPromise;    

    if (salvarResponse) {
      console.log('🌐 A URL capturada do POST/PUT é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);

      try {        
        respostaJson = await salvarResponse.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJson, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }
    }    
    
    let idCategoria = respostaJson?.data?.id?.toString()?.trim() || respostaJson?.id?.toString()?.trim();
    
    if (!idCategoria && salvarResponse) {
      const urlInterceptada = salvarResponse.url();      
      const uuidMatch = urlInterceptada.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      
      if (uuidMatch) {
        idCategoria = uuidMatch[0];
      } else {        
        const partes = urlInterceptada.split('?')[0].split('/');
        idCategoria = partes[partes.length - 1];
      }
    }
    
    if (salvarResponse && idCategoria) {     
      const urlSemQuery = salvarResponse.url().split('?')[0];
      
      const urlRegistroCriado = urlSemQuery.endsWith(idCategoria) 
        ? urlSemQuery 
        : `${urlSemQuery}/${idCategoria}`;      
        
      const headersGetRegistro = { ...salvarResponse.request().headers() };      
      delete headersGetRegistro['content-type'];
      delete headersGetRegistro['content-length'];
      delete headersGetRegistro[':method'];
      delete headersGetRegistro[':path'];
      delete headersGetRegistro[':authority'];
      delete headersGetRegistro[':scheme'];      
      
      const getCriadoResponse = await page.request.get(urlRegistroCriado, {
        headers: headersGetRegistro,
      });

      console.log('🌐 URL do registro atualizado:', urlRegistroCriado);
      console.log('✅ RESPOSTA DA API AO CONSULTAR O REGISTRO');
      console.log('✅ ID do Registro:', idCategoria);    
      console.log(`✅ Status GET: ${getCriadoResponse.status()}`);

      try {
        const dadosCriado = await getCriadoResponse.json();
        console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(dadosCriado, null, 2));
      } catch (error) {
        console.error('⚠️ Erro ao converter resposta para JSON no GET:', error);
      }
    } else {
      console.log('⚠️ Não foi possível identificar o ID do registro na URL nem no JSON.');
    }        
    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});