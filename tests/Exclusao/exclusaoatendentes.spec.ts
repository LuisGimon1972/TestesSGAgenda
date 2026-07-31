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
    
    const btnAcoes = linhaSelecionada
      .locator('td')
      .last()
      .locator('button')
      .first();

    await btnAcoes.scrollIntoViewIfNeeded();
    await btnAcoes.click({ force: true });
    console.log('✅ Clicou nos 3 pontos (Ações)');
    
    await page.waitForTimeout(500);
    
    const deletarAtendentePromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/') || response.url().includes('/service-providers') || response.url().includes('/users') || response.url().includes('/atendente')) &&
        response.request().method() === 'DELETE' &&
        response.status() >= 200 &&
        response.status() < 300,
      { timeout: 15000 }
    ).catch(() => null);
    
    const menuSuspenso = page.locator('.q-menu').last();
    const opcaoExcluir = menuSuspenso.getByText(/Excluir/i).first();
    
    await expect(opcaoExcluir).toBeVisible({ timeout: 10000 });
    await opcaoExcluir.click({ force: true });        
    console.log('✅ Clicou na opção Excluir Atendente dentro do menu dropdown');
    
    await page.waitForTimeout(1000); 
    
    const btnConfirmarModal = page
      .locator('.q-dialog, [role="dialog"]')
      .locator('button, .q-btn')
      .filter({ hasText: /sim|confirmar|excluir|ok|yes|eliminar/i })
      .first(); 

    if (await btnConfirmarModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnConfirmarModal.click({ force: true });
      console.log('✅ Clicou em Confirmar no modal');
    } else {
      console.log('⚠️ Nenhum modal encontrado, verificando se o sistema excluiu direto...');
    }

    await capturarRequisicoesApi(page);     
    
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
      /Atendente (deletado|excluído) com sucesso|Registro (deletado|excluído)|removido com sucesso/i,
      { timeout: 15000 }
    );

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(2000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});