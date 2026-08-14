import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { obterProdutoAleatorio } from '../../utils/listaprodutos';
import { navegarPara } from '../../utils/navegar';

test.describe('Teste de Edição de Produtos', () => {

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

    await navegarPara(page, 'Profissionais');
    await navegarPara(page, 'Catálogo', 'Produtos');    

    await expect(page.getByText(/Produtos/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('Deve selecionar aleatoriamente um produto da lista e abrir edição.', async ({ page }) => {   
    
    const linhas = page.locator('tbody tr');

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 produto').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const nomeProdutoee = (await linhaSelecionada.locator('td').first().innerText()).trim();
    console.log(`✅ Produto selecionado: ${nomeProdutoee}`);    
    
    const btnEditar = linhaSelecionada
      .locator('button, a, i, .q-btn, .material-icons')
      .filter({ hasText: /edit/i })
      .first();
    
    await btnEditar.scrollIntoViewIfNeeded();
    await btnEditar.click({ force: true });    

    await page.waitForTimeout(1000); 
    
    const salvarProdutoPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('//products') || response.url().includes('/produto')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
    ).catch(() => null);
    
    const nomeProduto = `${obterProdutoAleatorio().nome}`;
    const valor = '3500';
    const quantidade = '56';    
    const comissao = '5000';    
    
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
      try {
        const campo = page.locator('input:visible').nth(index);       
        
        await campo.waitFor({ state: 'visible', timeout: 10000 });                              
        await campo.clear();        
        await page.waitForTimeout(100);
        
        if (texto) {        
          await campo.fill(texto); 
        }

        if (index === 1 || index === 3) {
          console.log(`✅ ${nomeCampo}: ${Number(texto) / 100}%`);
        } else if (nomeCampo) {
          console.log(`✅ ${nomeCampo}: ${texto}`);
          
        }
        
      } catch (e) {
        console.error(`❌ Falha ao tentar preencher o campo: ${nomeCampo}`, e);
      }
    };
    
    await preencherCampo(0, nomeProduto, 'Nome Produto Alterado');
    await preencherCampo(1, valor, 'Valor Alterado');
    await preencherCampo(2, quantidade, 'Quantidade Alterada');
    await preencherCampo(3, comissao, 'Comissão Alterada');    

    await page.waitForTimeout(500);       

    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');                 

    let respostaJson: any = null;
    const salvarResponse = await salvarProdutoPromise;    

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
    
    let idProduto = respostaJson?.data?.id?.toString()?.trim() || respostaJson?.id?.toString()?.trim();
    
    if (!idProduto && salvarResponse) {
      const urlInterceptada = salvarResponse.url();      
      const uuidMatch = urlInterceptada.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      
      if (uuidMatch) {
        idProduto = uuidMatch[0];
      } else {        
        const partes = urlInterceptada.split('?')[0].split('/');
        idProduto = partes[partes.length - 1];
      }
    }
    
    if (salvarResponse && idProduto) {     
      const urlSemQuery = salvarResponse.url().split('?')[0];
      
      const urlRegistroCriado = urlSemQuery.endsWith(idProduto) 
        ? urlSemQuery 
        : `${urlSemQuery}/${idProduto}`;      
        
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
      console.log('✅ ID do Registro:', idProduto);    
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