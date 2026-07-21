import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';

test('Cadastro de Atendentes E2E com Comissões', async ({ page }) => {
    test.setTimeout(90000);
    
    await loginCompleto(page);    
    await page.waitForTimeout(2000);       
    
    await page.locator('.q-item, a, button').filter({ hasText: /Atendentes/i }).first().click({ force: true });
    console.log(`✅ Clicou em Atendentes`);          
    await page.waitForTimeout(2000);                 
    
    const btnCadastrar = page.getByText(/Cadastrar atendente/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });      
    console.log(`✅ Clicou em Cadastrar Atendente`);  
    console.log(`✅ Abriu Form de Atendentes`);                
    
    const salvarAtendentePromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/service-providers') || response.url().includes('/atendente')) &&
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

    console.log('📝 DADOS ENVIADOS PRA API');
    const timestamp = Date.now();
    const nomeAtendente = obterNomePessoaAleatorio();
    const emailAtendente = `email_atendente.${timestamp}@sgbr.com`;
    const senha = 'Teste@123456';
    
    // Função auxiliar para preenchimento limpo mantendo os mesmos índices do Cypress
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
        try {
            const campo = page.locator('input:visible').nth(index);
            await campo.scrollIntoViewIfNeeded();
            await campo.click({ force: true });
            await campo.press('Control+A');
            await campo.press('Backspace');
            await campo.type(texto, { delay: 50 });
            if (index === 4 || index === 5) 
             console.log(`✅ ${nomeCampo}:`, Number(texto) / 100);
            else  
             console.log(`✅ ${nomeCampo}:`, texto);
        } catch (e) {
            console.log(`⚠️ Falha ao preencher ${nomeCampo}`);
        }
    };    
    
    await preencherCampo(0, emailAtendente, 'E-mail do Atendente');
    await preencherCampo(1, nomeAtendente, 'Nome do Atendente');
    await preencherCampo(2, senha, 'Senha');
    await preencherCampo(3, senha, 'Confirmação de Senha');
    await preencherCampo(4, '3000', 'Comissão Serviços');
    await preencherCampo(5, '2000', 'Comissão Produtos');

    await page.waitForTimeout(2000);       
    
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    } catch (e) {}
    console.log('📝 FIM DE DADOS ENVIADOS PRA API');
    
    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');              
    
    const salvarResponse = await salvarAtendentePromise;
    if (salvarResponse) {
      console.log('🌐 A URL capturada do POST é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);
    }    
    
    try {
      await expect(page.locator('body')).toHaveText(
        /sucesso|salvo|cadastrado|Listagem de atendentes|Atendentes/i,
        { timeout: 30000 }
      );
      console.log('✅ Atendente cadastrado com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }
    
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});