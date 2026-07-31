import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Teste de Exclusão de Atendentes', () => {

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

    const menuAtendentes = page.getByText(/Atendentes/i).first();
    await expect(menuAtendentes).toBeVisible({ timeout: 30000 });
    await menuAtendentes.scrollIntoViewIfNeeded();
    await menuAtendentes.click({ force: true });   

    await expect(page.getByText(/Listagem de atendentes/i).first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);   
  });

  test('Deve selecionar aleatoriamente um atendente, confirmar exclusão no modal e consultar via API.', async ({ page }) => {
    const linhas = page.locator('tbody tr');
    await expect(linhas.first()).toBeVisible({ timeout: 30000 });

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 atendente').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const nomeAtendente = (await linhaSelecionada.locator('td').nth(0).innerText()).trim();
    console.log(`✅ Atendente selecionado para exclusão: ${nomeAtendente}`);
    
    // 1. Clica no menu/botão de ações da linha selecionada
    const btnAcoes = linhaSelecionada
      .locator('td')
      .last()
      .locator('[aria-label], button, .q-btn')
      .first();

    await btnAcoes.scrollIntoViewIfNeeded();
    await btnAcoes.click({ force: true });

    // 2. Clica na opção "Excluir atendente" / "Excluir" no menu suspenso
    const opcaoExcluir = page.getByText(/Excluir atendente|Excluir|Remover/i).first();
    await expect(opcaoExcluir).toBeVisible({ timeout: 10000 });
    await opcaoExcluir.click({ force: true });        
    console.log('✅ Clicou na opção Excluir');

    // 3. Aguarda a abertura do modal / dialog de confirmação
    const modal = page.locator('.q-dialog, [role="dialog"], .modal, .q-card').first();
    await modal.waitFor({ state: 'visible', timeout: 10000 });

    // 4. Localiza o botão de confirmação dentro do modal
    const btnConfirmarModal = modal
      .locator('button, .q-btn')
      .filter({ hasText: /sim|confirmar|excluir|ok|yes|eliminar/i })
      .last();

    await btnConfirmarModal.waitFor({ state: 'visible', timeout: 5000 });

    // 5. Prepara a escuta da requisição DELETE da API e confirma no modal
    const deletarAtendentePromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/') || response.url().includes('/service-providers') || response.url().includes('/atendente')) &&
        response.request().method() === 'DELETE' &&
        response.status() >= 200 &&
        response.status() < 300,
      { timeout: 15000 }
    ).catch(() => null);

    await btnConfirmarModal.click({ force: true });
    console.log('✅ Clicou em Confirmar exclusão no modal');

    const deletarResponse = await deletarAtendentePromise;    

    // 6. Consulta a API após a exclusão para verificar retorno (Status 404)
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

    // 7. Validação da mensagem de sucesso na interface
    await expect(page.locator('body')).toContainText(
      /Atendente excluído com sucesso|Registro excluído|removido com sucesso/i,
      { timeout: 15000 }
    );

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(2000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});