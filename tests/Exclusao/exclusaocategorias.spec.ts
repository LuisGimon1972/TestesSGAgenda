import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

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

    await page.waitForTimeout(2000);               
    await page.locator('.q-item, a, button').filter({ hasText: /Categorias/i }).first().click({ force: true });
    console.log(`✅ Clicou em Categorias`);          
    
    await expect(page.getByText(/Listagem de categorias/i).first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(1000); 
  });

  test('Deve selecionar aleatoriamente uma categoria, excluir e consultar via API.', async ({ page }) => {   
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
      console.log(`⚠️ Não é possível excluir categorias: a grade está vazia!`);
      test.skip(); 
      return;
    }

    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    // Valida se a linha retornada é uma mensagem de "nenhum registro"
    const textoLinha = await linhaSelecionada.innerText().catch(() => '');
    if (/nenhum|vazio|não encontrado|aguarde/i.test(textoLinha)) {
      console.log(`⚠️ A linha encontrada é uma mensagem de estado vazio: "${textoLinha.trim()}"`);
      test.skip();
      return;
    }

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
    
    const deletarCategoriaPromise = page.waitForResponse(
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
    console.log('✅ Clicou na opção de excluir da categoria');
    
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

    await capturarRequisicoesApi(page);     
    
    const deletarResponse = await deletarCategoriaPromise;    

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
   
    await expect(page.locator('body')).toContainText(
      /Categoria (deletada|excluída) com sucesso|Registro (deletado|excluído)|removida com sucesso/i,
      { timeout: 15000 }
    );
    
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(2000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});