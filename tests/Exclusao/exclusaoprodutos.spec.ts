import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Teste de Exclusão de Produtos', () => {

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

    await page.locator('.q-item, a, button').filter({ hasText: /Produtos/i }).first().click({ force: true });
    console.log(`✅ Clicou em Produtos`);          

    await expect(page.getByText(/Listagem de produtos/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000); 
  });

  test('Deve selecionar aleatoriamente um produto, confirmar exclusão no modal e consultar via API.', async ({ page }) => {   
    page.on('dialog', async (dialog) => {
      console.log(`💬 Diálogo nativo do navegador: ${dialog.message()}`);
      await dialog.accept();
    });

    const linhas = page.locator('tbody tr');    

    await expect(linhas.first()).toBeVisible({ timeout: 30000 });

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 produto').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);    

    console.log(`✅CAPTURA DO REGISTRO DA GRADE ANTES DE SER REMOVIDO:`)
    const nomeProduto = (await linhaSelecionada.locator('td').first().innerText()).trim();
    console.log(`✅ Produto selecionado para exclusão: ${nomeProduto}`);    
    const valor = (await linhaSelecionada.locator('td').nth(1).innerText()).trim(); 
    console.log(`✅ Valor do Produto: ${valor}`);    
    const quantidade = (await linhaSelecionada.locator('td').nth(2).innerText()).trim(); 
    console.log(`✅ Quantidade de Produto: ${quantidade}`);        
    
    const deletarProdutoPromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/') || response.url().includes('/products') || response.url().includes('/produto')) &&
        response.request().method() === 'DELETE' &&
        response.status() >= 200 &&
        response.status() < 300,
      { timeout: 15000 }
    ).catch(() => null);       
    
    const btnExcluir = linhaSelecionada
      .locator('button, a, i, .q-btn, .material-icons')
      .filter({ hasText: /delete|excluir|remover|trash/i })
      .first();
    
    await btnExcluir.scrollIntoViewIfNeeded();
    await btnExcluir.click({ force: true });    
    console.log('✅ Clicou no botão Excluir da linha');
    
    const modal = page.locator('.q-dialog, [role="dialog"], .modal, .q-card').first();
    await modal.waitFor({ state: 'visible', timeout: 10000 });
    
    const btnConfirmarModal = modal
      .locator('button, .q-btn')
      .filter({ hasText: /sim|confirmar|excluir|ok|yes|eliminar/i })
      .last(); 

    await btnConfirmarModal.waitFor({ state: 'visible', timeout: 5000 });

    if (await btnConfirmarModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnConfirmarModal.click({ force: true });
      console.log('✅ Clicou em Confirmar no modal');
    } else {
      console.log('⚠️ Nenhum modal encontrado, verificando se o sistema excluiu direto...');
    }     
    
    const deletarResponse = await deletarProdutoPromise;    

    await capturarRequisicoesApi(page);     

    if (deletarResponse) {
      const urlRegistroDeletado = deletarResponse.url();
      console.log('🌐 URL do DELETE capturada:', urlRegistroDeletado);

      const headersGet = { ...deletarResponse.request().headers() };      
      delete headersGet['content-type'];
      delete headersGet['content-length'];
      delete headersGet[':method'];
      delete headersGet[':path'];
      delete headersGet[':authority'];
      delete headersGet[':scheme'];      

      const consultaResponse = await page.request.get(urlRegistroDeletado, {
        headers: headersGet,
      });

      console.log('*** RESPOSTA DA API AO CONSULTAR REGISTRO EXCLUÍDO ***');
      console.log(`✅ Status GET pós-exclusão: ${consultaResponse.status()}`);

      if (consultaResponse.status() === 404) {
        console.log(`✅ Registro não foi encontrado no sistema (Status 404). Exclusão confirmada!`);
      } else {
        try {
          const dadosConsulta = await consultaResponse.json();
          console.log('📦 JSON do Registro Consultado Pós-Exclusão:\n', JSON.stringify(dadosConsulta, null, 2));
        } catch {
          console.log('⚠️ Resposta recebida sem corpo JSON.');
        }
      }
    } else {
      console.log('⚠️ A requisição DELETE não foi capturada. Pode ser que o botão Confirmar não disparou a ação corretamente.');
    }

    await expect(page.locator('body')).toContainText(
      /Produto (deletado|excluído) com sucesso|Registro (deletado|excluído)|removido com sucesso/i,
      { timeout: 15000 }
    );
    
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(2000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});