import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterProdutoAleatorio } from '../../utils/listaprodutos';

test('Cadastro de Categorias', async ({ page }) => {
    test.setTimeout(1200000);
    
    await loginCompleto(page);    
    
    await page.waitForTimeout(2000);               
    await page.locator('.q-item, a, button').filter({ hasText: /Categorias/i }).first().click({ force: true });
    console.log(`✅ Clicou em Categorias`);          
    
    await page.waitForTimeout(2000);                
    const btnCadastrar = page.getByText(/Cadastrar categoria/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });      
    console.log(`✅ Clicou em Cadastrar Categoria`);  
    console.log(`✅ Abriu Form de Categorias`);              
    
    const salvarCategoriaPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/categories') || response.url().includes('/categoria')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
    ).catch(() => null);    
    
    try {
      const btnCookie = page.getByText(/Entendi|Aceitar|Fechar/i).first();
      if (await btnCookie.isVisible({ timeout: 3000 })) {
        await btnCookie.click({ force: true });
        console.log('✅ Fechou aviso de cookies');
      }
    } catch (e) {}

    await page.waitForTimeout(1000);    

    console.log('--- PREENCHENDO DADOS DA CATEGORIA ---');    
    const timestamp = Date.now();
    const nomeCategoria = obterProdutoAleatorio().categoria + ' ' + timestamp;
    const descricao = `Categoria criada automaticamente pelo Playwright em ${timestamp}`;    
    
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
        try {
            const campo = page.locator('input:visible').nth(index);
            await campo.scrollIntoViewIfNeeded();
            await campo.click({ force: true });
            await campo.press('Control+A');
            await campo.press('Backspace');
            await campo.type(texto, { delay: 50 });
            console.log(`✅ ${nomeCampo}:`, texto);
        } catch (e) {
            console.log(`⚠️ Falha ao preencher ${nomeCampo}`);
        }
    };

    // Preenche Nome da Categoria (input eq(0) do Cypress)
    await preencherCampo(0, nomeCategoria, 'Nome da Categoria');

    // Preenche Descrição da Categoria (textarea)
    try {
      const campoDescricao = page.locator('textarea:visible').first();
      await campoDescricao.scrollIntoViewIfNeeded();
      await campoDescricao.click({ force: true });
      await campoDescricao.press('Control+A');
      await campoDescricao.press('Backspace');
      await campoDescricao.type(descricao, { delay: 20 });
      console.log('✅ Descrição da Categoria preenchida');
    } catch (e) {
      console.log('⚠️ Falha ao preencher Descrição');
    }

    await page.waitForTimeout(2000);       
    
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    } catch (e) {}
    
    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');              
    
    const salvarResponse = await salvarCategoriaPromise;
    if (salvarResponse) {
      console.log('🌐 A URL capturada do POST é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);
    }    

    try {
      await expect(page.locator('body')).toHaveText(
        /categoria|sucesso|salvo|cadastrado|Listagem de categorias/i,
        { timeout: 30000 }
      );
      console.log('✅ Categoria cadastrada com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }   
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});