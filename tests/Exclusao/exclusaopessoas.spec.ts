import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';

test.describe('Teste de Exclusão de Clientes', () => {

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

    const menuClientes = page.getByText(/Clientes/i).first();
    await expect(menuClientes).toBeVisible({ timeout: 30000 });
    await menuClientes.scrollIntoViewIfNeeded();
    await menuClientes.click({ force: true });   

    await expect(page.getByText(/Listagem de clientes/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('Deve selecionar aleatoriamente um cliente, confirmar exclusão no modal e consultar via API.', async ({ page }) => {   
    
    const linhas = page.locator('tbody tr');

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 cliente').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);
    
    const idCliente = (await linhaSelecionada.locator('td').nth(1).innerText()).trim();
    console.log(`✅CAPTURA DO REGISTRO DA GRADE ANTES DE SER REMOVIDO:`)
    const nomeCliente = (await linhaSelecionada.locator('td').first().innerText()).trim();
    console.log(`✅ Cliente selecionado para exclusão: ${nomeCliente}`);    
    const telefone = (await linhaSelecionada.locator('td').nth(1).innerText()).trim(); 
    console.log(`✅ Telefone: ${telefone}`);    
    const documento = (await linhaSelecionada.locator('td').nth(2).innerText()).trim(); // Coluna 4 (PROVEEDOR)
    console.log(`✅ Documento: ${documento}`);    
    const email = (await linhaSelecionada.locator('td').nth(3).innerText()).trim(); // Coluna 7 (PARAGUAY)
    console.log(`✅ E-mail: ${email}`);    
    const datanac = (await linhaSelecionada.locator('td').nth(4).innerText()).trim(); // Coluna 7 (PARAGUAY)
    console.log(`✅ Data de nascimento: ${datanac}`);      
    
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
    
    const deletarPessoaPromise = page.waitForResponse(
      (response) =>
        (response.url().includes('/api/') || response.url().includes('/customers') || response.url().includes('/pessoa')) &&
        response.request().method() === 'DELETE' &&
        response.status() >= 200 &&
        response.status() < 300,
      { timeout: 15000 }
    ).catch(() => null);

    await btnConfirmarModal.click({ force: true });
    console.log('✅ Clicou em Confirmar no modal');

    const deletarResponse = await deletarPessoaPromise;    
    
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
        console.log(`✅ Registro ${idCliente} não foi encontrado no sistema (Status 404). Exclusão confirmada!`);
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
    
    await expect(page.locator('body')).toContainText(
      /Cliente excluído com sucesso|Registro excluído|removido com sucesso/i,
      { timeout: 15000 }
    );
    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});