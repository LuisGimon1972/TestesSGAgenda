import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Teste de Exclusão de Serviços', () => {

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

    await page.locator('.q-item, a, button').filter({ hasText: /Servi[çc]os/i }).first().click({ force: true });
    console.log(`✅ Clicou em Serviços`);          
    console.log(`✅ Apareceu Listagem de serviços`);    
    
    await page.waitForTimeout(500);       

    await expect(page.getByText(/Listagem de serviços/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('Deve selecionar aleatoriamente um serviço, excluir e consultar via API.', async ({ page }) => {   
    page.on('dialog', async (dialog) => {
      console.log(`💬 Diálogo nativo do navegador: ${dialog.message()}`);
      await dialog.accept();
    });

    const linhas = page.locator('tbody tr');
    await expect(linhas.first()).toBeVisible({ timeout: 30000 });

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 serviço').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const nomeServico = (await linhaSelecionada.locator('td').nth(1).innerText()).trim();
    console.log(`✅ Serviço selecionado para exclusão: ${nomeServico}`);    
    
    // Prepara a escuta da requisição DELETE antes de acionar a exclusão
    const deletarServicoPromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/') || response.url().includes('/services') || response.url().includes('/servico')) &&
        response.request().method() === 'DELETE' &&
        response.status() >= 200 &&
        response.status() < 300,
      { timeout: 15000 }
    ).catch(() => null);

    // Como não há 3 pontos, busca o botão de excluir diretamente na linha (ex: ícone de lixeira, delete ou botão com texto)
    const btnExcluir = linhaSelecionada
      .locator('button, a, i, .q-btn, .material-icons')
      .filter({ hasText: /delete|lixeira|excluir|trash|remove/i })
      .first();
    
    // Fallback caso o botão seja apenas um ícone sem texto claro na filtragem
    const botaoAlvo = (await btnExcluir.isVisible().catch(() => false)) 
      ? btnExcluir 
      : linhaSelecionada.locator('button, .q-btn').last();

    await botaoAlvo.scrollIntoViewIfNeeded();
    await botaoAlvo.click({ force: true });    
    console.log('✅ Clicou na opção de excluir do serviço');

    // Aguarda o modal de confirmação (se houver)
    await page.waitForTimeout(1000); 

    const btnConfirmarModal = page
      .locator('.q-dialog, [role="dialog"], .modal, .q-card')
      .locator('button, .q-btn')
      .filter({ hasText: /sim|confirmar|excluir|ok|yes|eliminar/i })
      .first();

    if (await btnConfirmarModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnConfirmarModal.click({ force: true });
      console.log('✅ Clicou em Confirmar no modal');
    } else {
      console.log('⚠️ Nenhum modal encontrado, verificando se o sistema excluiu direto...');
    }

    // Captura a resposta da API DELETE
    const deletarResponse = await deletarServicoPromise;    

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
      console.log('⚠️ A requisição DELETE não foi capturada.');
    }    

    // Validação da mensagem de sucesso na tela
    await expect(page.locator('body')).toContainText(
      /Serviço (deletado|excluído) com sucesso|Registro (deletado|excluído)|removido com sucesso/i,
      { timeout: 15000 }
    );
    
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(2000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});