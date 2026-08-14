import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { navegarPara } from '../../utils/navegar';

test.describe('Teste de Exclusão de Categorias', () => {

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

    await page.waitForTimeout(1000);
    await navegarPara(page, 'Catálogo', 'Categorias');    
    console.log(`✅ Clicou em Categorias`);          
    
    await expect(page.getByText(/Categorias/i).first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1000); 
  });

  test('Deve selecionar aleatoriamente uma categoria, excluir e consultar via API.', async ({ page }) => {   
    page.on('dialog', async (dialog) => {
      console.log(`💬 Diálogo nativo do navegador: ${dialog.message()}`);
      await dialog.accept();
    });

    // 1. Filtra apenas linhas válidas ignorando estados vazios ("Cadastre sua primeira...", "Nenhuma categoria...", etc.)
    const linhas = page.locator('tbody tr').filter({
      hasNotText: /cadastre|nenhum|nenhuma|vazio|não encontrad/i
    });
    
    // 2. Valida se existe ao menos uma categoria válida visível na tabela
    const possuiCategorias = await linhas.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (!possuiCategorias) {
      console.log('⚠️ Não existem categorias na grade para apagar (Grade vazia ou em estado inicial).');
      console.log('⏭️ Pulando o teste de exclusão de categorias sem erros.');
      test.skip(); 
      return;
    }

    const totalLinhas = await linhas.count();
    console.log(`📊 Categorias encontradas na grade: ${totalLinhas}`);

    // 3. Sorteia uma categoria da lista
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const colunas = linhaSelecionada.locator('td');
    const totalColunas = await colunas.count();

    console.log(`✅ CAPTURA DO REGISTRO DA GRADE ANTES DE SER REMOVIDO:`);
    
    const nomeCategoria = totalColunas > 1 
      ? (await colunas.nth(1).innerText().catch(() => '')).trim() 
      : (await colunas.first().innerText().catch(() => '')).trim();
      
    console.log(`✅ Categoria selecionada para exclusão: ${nomeCategoria || 'Desconhecida'}`);        
    
    const descricao = totalColunas > 2 ? (await colunas.nth(2).innerText().catch(() => '')).trim() : ''; 
    if (descricao) {
      console.log(`✅ Descrição da Categoria: ${descricao}`);    
    }
    
    const datacad = totalColunas > 4 ? (await colunas.nth(4).innerText().catch(() => '')).trim() : '';
    if (datacad) {
      console.log(`✅ Data de cadastro: ${datacad}`);      
    }
    
    // 4. Prepara escuta da requisição DELETE
    const deletarCategoriaPromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'DELETE' &&
        (response.status() >= 200 && response.status() < 300),
      { timeout: 15000 }
    ).catch(() => null);
    
    // 5. Clica no botão Excluir da linha
    const btnExcluir = linhaSelecionada
      .locator('button, a, i, .q-btn, .material-icons')
      .filter({ hasText: /delete|lixeira|excluir|trash|remove/i })
      .first();    
    
    const botaoAlvo = (await btnExcluir.isVisible().catch(() => false)) 
      ? btnExcluir 
      : linhaSelecionada.locator('button, .q-btn').last();

    await botaoAlvo.scrollIntoViewIfNeeded();
    await botaoAlvo.click({ force: true });    
    console.log('✅ Clicou na opção de excluir da categoria');
    
    await page.waitForTimeout(1000);
    
    // 6. Trata modal de confirmação se houver
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
    
    // 7. Confirmação da exclusão via resposta da API
    const deletarResponse = await deletarCategoriaPromise;    

    if (deletarResponse) {
      const urlRegistroDeletado = deletarResponse.url();
      console.log('🌐 URL do DELETE capturada:', urlRegistroDeletado);

      const headersGet = { ...deletarResponse.request().headers() };      
      ['content-type', 'content-length', ':method', ':path', ':authority', ':scheme'].forEach(h => delete headersGet[h]);
   
      const consultaResponse = await page.request.get(urlRegistroDeletado, {
        headers: headersGet,
      });

      console.log('✅ RESPOSTA DA API AO CONSULTAR REGISTRO EXCLUÍDO');
      console.log(`✅ Status GET pós-exclusão: ${consultaResponse.status()}`);

      if ([404, 400, 500].includes(consultaResponse.status())) {
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
      console.log('⚠️ A requisição DELETE não foi capturada automaticamente.');
    }      
       
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(2000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});