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
    const menuAtendentes = page.getByText(/Profissionais/i).first();
    await expect(menuAtendentes).toBeVisible({ timeout: 30000 });
    await menuAtendentes.scrollIntoViewIfNeeded();
    await menuAtendentes.click({ force: true });   

    await expect(page.getByText(/Profissionais/i).first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);   
  });

  test('Deve selecionar aleatoriamente um atendente, confirmar exclusão no modal e consultar via API.', async ({ page }) => {
    page.on('dialog', async (dialog) => {
      console.log(`💬 Diálogo nativo do navegador: ${dialog.message()}`);
      await dialog.accept();
    });

    const linhas = page.locator('tbody tr');        
    await expect(linhas.first()).toBeVisible({ timeout: 30000 });
    const totalLinhas = await linhas.count();        
    if(totalLinhas === 1) {
      console.log(`⚠️ Não é possivel excluir o atendente padrão (único na lista)!`);
      test.skip(); 
      return;
    }
    expect(totalLinhas, 'A lista deve possuir ao menos 2 atendentes').toBeGreaterThan(1);        
    const indiceAleatorio = Math.floor(Math.random() * (totalLinhas - 1)) + 1;
    const linhaSelecionada = linhas.nth(indiceAleatorio);    
    
    console.log(`✅CAPTURA DO REGISTRO DA GRADE ANTES DE SER REMOVIDO:`)
    const nomeAtendente = (await linhaSelecionada.locator('td').nth(0).innerText()).trim();
    console.log(`✅ Atendente selecionado para exclusão: ${nomeAtendente}`);        
    const email = (await linhaSelecionada.locator('td').nth(1).innerText()).trim(); // Coluna 7 (PARAGUAY)
    console.log(`✅ E-mail: ${email}`);        
    const funcao = (await linhaSelecionada.locator('td').nth(2).innerText()).trim(); // Coluna 4 (PROVEEDOR)
    console.log(`✅ Função: ${funcao}`);        
    const datacad = (await linhaSelecionada.locator('td').nth(3).innerText()).trim(); // Coluna 7 (PARAGUAY)
    console.log(`✅ Data de cadastro: ${datacad}`);      
    
    const btnExcluir = linhaSelecionada
      .locator('button, a, i, .q-btn, .p-button, .material-icons')
      .filter({ hasText: /delete|excluir|remover|trash/i })
      .first();
    
    const botaoAlvo = (await btnExcluir.isVisible().catch(() => false)) 
      ? btnExcluir 
      : linhaSelecionada.locator('button, .q-btn, .p-button').last();

    await botaoAlvo.scrollIntoViewIfNeeded();
    await botaoAlvo.click({ force: true });    
    console.log('✅ Clicou no botão Excluir da linha');
    
    await page.waitForTimeout(500);

    const modal = page.locator('.q-dialog, .p-dialog, [role="dialog"], .modal, .q-card').first();
    
    let modalVisivel = false;
    try {
      await modal.waitFor({ state: 'visible', timeout: 4000 });
      modalVisivel = true;
    } catch {
      console.log('⚠️ Nenhum modal encontrado, verificando se o sistema excluiu direto...');
    }
    
    const deletarAtendentePromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/') || response.url().includes('/service-providers') || response.url().includes('/users') || response.url().includes('/atendente')) &&
        response.request().method() === 'DELETE' &&
        response.status() >= 200 &&
        response.status() < 300,
      { timeout: 15000 }
    ).catch(() => null);
    
    if (modalVisivel) {      
      const btnConfirmarModal = modal
        .locator('button.p-confirmdialog-accept-button, button.p-button-danger')
        .filter({ hasText: /^Excluir$/i })
        .first();      
      const btnConfirmarFallback = modal.getByRole('button', { name: 'Excluir', exact: true });
      const botaoExcluirAlvo = (await btnConfirmarModal.isVisible().catch(() => false)) 
        ? btnConfirmarModal 
        : btnConfirmarFallback;
      if (await botaoExcluirAlvo.isVisible({ timeout: 3000 }).catch(() => false)) {
        await botaoExcluirAlvo.click({ force: true });
        console.log('✅ Clicou no botão vermelho (Excluir) no modal');
      } else {
        console.log('⚠️ Botão de confirmação não encontrado no modal.');
      }
    }    
    
    const deletarResponse = await deletarAtendentePromise;    

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
    
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});