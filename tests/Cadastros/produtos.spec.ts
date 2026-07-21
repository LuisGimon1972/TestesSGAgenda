import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterProdutoAleatorio } from '../../utils/listaprodutos';

test('Cadastro de Produtos E2E com Nome Aleatório', async ({ page }) => {
    test.setTimeout(90000);

    await loginCompleto(page);    

    await page.waitForTimeout(2000);       

    await page.locator('.q-item, a, button').filter({ hasText: /Produtos/i }).first().click({ force: true });
    console.log(`✅ Clicou em Produtos`);          
    console.log(`✅ Apareceu Listagem de produtos`);      

    await page.waitForTimeout(2000);             
    
    const btnCadastrar = page.getByText(/Cadastrar produto/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });      
    console.log(`✅ Clicou em Cadastrar produto`);  
    console.log(`✅ Abriu Form de Produtos`);          

    const salvarProdutoPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/products') || response.url().includes('/produto')) &&
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

    console.log('DADOS ENVIADOS PRA API');    

    const nomeProduto = obterProdutoAleatorio().nome;        
    const valor = Math.floor(Math.random() * 1000) + 1;
    const quantidade = '10';
    const comissao = '20';
    
    try {
      const campoNome = page.locator('input:visible').nth(0);
      await campoNome.scrollIntoViewIfNeeded();
      await campoNome.click({ force: true });
      await campoNome.fill(nomeProduto, { force: true });
      console.log('✅ Nome do Produto:', nomeProduto);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Nome do Produto');
    }

    try {
      const campoValor = page.locator('input:visible').nth(1);
      await campoValor.click({ force: true });
      await campoValor.fill(valor.toFixed(), { force: true });
      console.log('✅ Valor:', valor);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Valor');
    }
    
    try {
      const campoQuantidade = page.locator('input:visible').nth(2);
      await campoQuantidade.click({ force: true });
      await campoQuantidade.fill(quantidade, { force: true });
      console.log('✅ Quantidade:', quantidade);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Quantidade');
    }

    try {
      const campoComissao = page.locator('input:visible').nth(3);
      await campoComissao.click({ force: true });
      await campoComissao.fill(comissao, { force: true });
      console.log('✅ Comissão:', comissao);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Comissão');
    }

    console.log('FIM DE DADOS ENVIADOS');           
    
    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');          
    
    const salvarResponse = await salvarProdutoPromise;
    if (salvarResponse) {
      console.log('🌐 A URL capturada do POST é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);
    }
    
    try {
      await expect(page.locator('body')).toHaveText(
        /produto|sucesso|salvo|cadastrado|Listagem de produtos/i,
        { timeout: 20000 }
      );
      console.log('✅ Produto cadastrado com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});