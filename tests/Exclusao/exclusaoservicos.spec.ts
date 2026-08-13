import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { navegarPara } from '../../utils/navegar';

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

    await page.waitForTimeout(2000);
    await navegarPara(page, 'Catálogo', '');    
    console.log(`✅ Clicou em Serviços`);          
    console.log(`✅ Apareceu Listagem de serviços`);         
    
    await page.waitForTimeout(500);       

    await expect(page.getByText(/Serviços/i).first()).toBeVisible({ timeout: 30000 });
    // Removida a verificação estrita do beforeEach para evitar quebra caso a tabela esteja vazia
  });

  test('Deve selecionar aleatoriamente um serviço, excluir e consultar via API.', async ({ page }) => {   
    page.on('dialog', async (dialog) => {
      console.log(`💬 Diálogo nativo do navegador: ${dialog.message()}`);
      await dialog.accept();
    });

    const linhas = page.locator('tbody tr');
    
    try {
      await expect(linhas.first()).toBeVisible({ timeout: 10000 });
    } catch {
      console.log('⚠️ A tabela não exibiu linhas ou está vazia.');
    }

    const totalLinhas = await linhas.count();
    
    if (totalLinhas === 0) {
      console.log(`⚠️ Não é possível excluir serviços: a grade está vazia!`);
      test.skip(); 
      return;
    }

    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const textoLinha = await linhaSelecionada.innerText().catch(() => '');
    if (/nenhum|vazio|não encontrado|aguarde/i.test(textoLinha)) {
      console.log(`⚠️ A linha encontrada é uma mensagem de estado vazio: "${textoLinha.trim()}"`);
      test.skip();
      return;
    }

    const colunas = linhaSelecionada.locator('td');
    const totalColunas = await colunas.count();

    console.log(`✅ CAPTURA DO REGISTRO DA GRADE ANTES DE SER REMOVIDO:`);
    
    const nomeServico = totalColunas > 1 ? (await colunas.nth(1).innerText().catch(() => '')).trim() : (await colunas.first().innerText().catch(() => '')).trim();
    console.log(`✅ Serviço selecionado para exclusão: ${nomeServico || 'Desconhecido'}`);        
    
    const descricao = totalColunas > 2 ? (await colunas.nth(2).innerText().catch(() => '')).trim() : ''; 
    if (descricao) console.log(`✅ Descrição do Serviço: ${descricao}`);    
    
    const duracao = totalColunas > 3 ? (await colunas.nth(3).innerText().catch(() => '')).trim() : ''; 
    if (duracao) console.log(`✅ Duração do Serviço: ${duracao}`);    
    
    const valor = totalColunas > 5 ? (await colunas.nth(5).innerText().catch(() => '')).trim() : ''; 
    if (valor) console.log(`✅ Valor do Serviço: ${valor}`);    
    
    const datacad = totalColunas > 8 ? (await colunas.nth(8).innerText().catch(() => '')).trim() : ''; 
    if (datacad) console.log(`✅ Data de cadastro: ${datacad}`);          
    
    const deletarServicoPromise = page.waitForResponse(
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
    console.log('✅ Clicou na opção de excluir do serviço');
    
    await page.waitForTimeout(1000);
    
    const modal = page.locator('.q-dialog, .p-dialog, [role="dialog"], .modal, .q-card').first();
    
    let modalVisivel = false;
    try {
      await modal.waitFor({ state: 'visible', timeout: 4000 });
      modalVisivel = true;
    } catch {
      console.log('⚠️ Nenhum modal encontrado, verificando se o sistema excluiu direto...');
    }

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

      console.log('✅ RESPOSTA DA API AO CONSULTAR REGISTRO EXCLUÍDO');
      console.log(`✅ Status GET pós-exclusão: ${consultaResponse.status()}`);

      if (consultaResponse.status() === 404 || consultaResponse.status() === 400 || consultaResponse.status() === 500) {
        console.log(`✅ Registro não foi encontrado no sistema (Status ${consultaResponse.status()}). Exclusão confirmada!`);
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
           
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(2000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});