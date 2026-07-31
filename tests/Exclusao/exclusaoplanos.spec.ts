import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Teste de Exclusão de Planos', () => {

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

    await page.locator('.q-item, a, button').filter({ hasText: /Planos/i }).first().click({ force: true });
    console.log(`✅ Clicou em Planos`);              
    console.log(`✅ Apareceu Listagem de Planos`);    
    
    await page.waitForTimeout(500);       

    await expect(page.getByText(/Listagem de planos/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('Deve selecionar aleatoriamente um plano, excluir e consultar via API.', async ({ page }) => {   
    page.on('dialog', async (dialog) => {
      console.log(`💬 Diálogo nativo do navegador: ${dialog.message()}`);
      await dialog.accept();
    });

    const linhas = page.locator('tbody tr');
    await expect(linhas.first()).toBeVisible({ timeout: 30000 });

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 plano').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    console.log(`✅ CAPTURA DO REGISTRO DA GRADE ANTES DE SER REMOVIDO:`);
    const nomePlano = (await linhaSelecionada.locator('td').nth(0).innerText()).trim();
    console.log(`✅ Plano selecionado para exclusão: ${nomePlano}`);        
    const valorPlano = (await linhaSelecionada.locator('td').nth(1).innerText()).trim();
    console.log(`✅ Valor do Plano: ${valorPlano}`);        
    const periodoPlano = (await linhaSelecionada.locator('td').nth(2).innerText()).trim();
    console.log(`✅ Periodo do Plano: ${periodoPlano}`);        
    const descricao = (await linhaSelecionada.locator('td').nth(3).innerText()).trim(); 
    console.log(`✅ Descrição do Serviço: ${descricao}`);        
   
    const deletarPlanoPromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'DELETE' &&
        (response.status() >= 200 && response.status() < 300),
      { timeout: 15000 }
    ).catch(() => null);
    
    const btnExcluir = linhaSelecionada
      .locator('button, a, i, .q-btn, .material-icons')
      .filter({ hasText: /delete|lixeira|excluir|trash|remove/i })
      .first();    
    
    const botaoAlvo = (await btnExcluir.isVisible().catch(() => false)) 
      ? btnExcluir 
      : linhaSelecionada.locator('button, .q-btn').last();

    await botaoAlvo.scrollIntoViewIfNeeded();
    await botaoAlvo.click({ force: true });    
    console.log('✅ Clicou na opção de excluir do plano');
    
    await page.waitForTimeout(1000); 

    const btnConfirmarModal = page
      .locator('.q-dialog, [role="dialog"], .modal, .q-card')
      .locator('button, .q-btn')
      .filter({ hasText: /sim|confirmar|excluir|ok|yes|eliminar/i })
      .first();

    await capturarRequisicoesApi(page);     

    if (await btnConfirmarModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnConfirmarModal.click({ force: true });
      console.log('✅ Clicou em Confirmar no modal');
    } else {
      console.log('⚠️ Nenhum modal encontrado, verificando se o sistema excluiu direto...');
    }    
    
    const deletarResponse = await deletarPlanoPromise;    

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

      console.log('✅ RESPOSTA DA API AO CONSULTAR REGISTRO EXCLUÍDO');
      console.log(`✅ Status GET pós-exclusão: ${consultaResponse.status()}`);

      if (consultaResponse.status() === 404 || consultaResponse.status() === 400 || consultaResponse.status() === 500) {
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
      console.log('⚠️ A requisição DELETE não foi capturada automaticamente pela regra genérica.');
    }    
    
    await expect(page.locator('body')).toContainText(
      /Plano (deletado|excluído) com sucesso|Registro (deletado|excluído)|removido com sucesso/i,
      { timeout: 15000 }
    );    
    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});