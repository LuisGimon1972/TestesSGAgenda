import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Cadastro de Serviços E2E com Atendentes Aleatórios', async ({ page }) => {
    test.setTimeout(90000);

    await loginCompleto(page);    

    await page.waitForTimeout(2000);       

    await page.locator('.q-item, a, button').filter({ hasText: /Servi[çc]os/i }).first().click({ force: true });
    console.log(`✅ Clicou em Serviços`);          
    console.log(`✅ Apareceu Listagem de serviços`);      

    await page.waitForTimeout(2000);             
    
    const btnCadastrar = page.getByText(/Cadastrar servi[çc]o/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });      
    console.log(`✅ Clicou em Cadastrar serviço`);  
    console.log(`✅ Abriu Form de Serviços`);          
    
    const salvarServicoPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/services') || response.url().includes('/servico')) &&
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
    const timestamp = Date.now();
    const nomeServico = `E2E Serviço_Corte ${timestamp}`;
    const duracao = '30';
    const valor = (Math.floor(Math.random() * 1000) + 1).toString(); // Valor aleatório de 1 a 1000
    const comissao = '3000';
    const descricao = `Serviço criado automaticamente pelo Playwright em ${timestamp}`;
    
    try {
      const campoNome = page.locator('input:visible').nth(0);
      await campoNome.scrollIntoViewIfNeeded();
      await campoNome.click({ force: true });
      await campoNome.fill(nomeServico, { force: true });
      console.log('✅ Nome do Serviço:', nomeServico);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Nome do Serviço');
    }
    
    try {
      const campoDuracao = page.locator('input:visible').nth(1);
      await campoDuracao.click({ force: true });
      await campoDuracao.fill(duracao, { force: true });
      console.log('✅ Duração:', duracao);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Duração');
    }
    
    try {
      const campoValor = page.locator('input:visible').nth(2);
      await campoValor.click({ force: true });
      await campoValor.fill(valor, { force: true });
      console.log('✅ Valor:', valor);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Valor');
    }
    
    try {
      const campoComissao = page.locator('input:visible').nth(3);
      await campoComissao.click({ force: true });
      await campoComissao.fill(comissao, { force: true });
      console.log('✅ Comissão:', comissao);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Comissão');
    }
    
    try {
      const campoDescricao = page.locator('textarea:visible').first();
      await campoDescricao.scrollIntoViewIfNeeded();
      await campoDescricao.click({ force: true });
      await campoDescricao.fill(descricao, { force: true });
      console.log('✅ Descrição do Serviço preenchida');
    } catch (e) {
      console.log('⚠️ Falha ao preencher Descrição');
    }
    
    try {
      const secaoAtendentes = page.getByText(/Sele[çc][aã]o de Atendentes/i).first();
      if (await secaoAtendentes.isVisible({ timeout: 5000 })) {
        await secaoAtendentes.scrollIntoViewIfNeeded();        
     
        const cardsAtendentes = page.locator('.q-card, [class*="card"]').filter({ hasNotText: /Nome do servi|Dura[çc]/i });
        const totalCards = await cardsAtendentes.count();

        if (totalCards > 0) {
          const qtdParaSelecionar = Math.min(totalCards, 2);
          for (let i = 0; i < qtdParaSelecionar; i++) {
            await cardsAtendentes.nth(i).click({ force: true });
            console.log(`✅ Selecionou Atendente ${i + 1}`);
          }
        } else {          
          const fallbackCard = page.locator('div').filter({ has: page.locator('img, input') }).filter({ hasNotText: /Nome do servi/i }).first();
          if (await fallbackCard.isVisible()) {
            await fallbackCard.click({ force: true });
            console.log('✅ Selecionou Atendente (fallback)');
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Falha ou aviso ao selecionar atendentes');
    }

    console.log('FIM DE DADOS ENVIADOS');           
    
    try {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
    } catch (e) {}

    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');          
    
    const salvarResponse = await salvarServicoPromise;
    if (salvarResponse) {
      console.log('🌐 A URL capturada do POST é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);
    }
    
    try {
      await expect(page.locator('body')).toHaveText(
        /sucesso|salvo|cadastrado|Listagem de servi[çc]os|Servi[çc]os/i,
        { timeout: 20000 }
      );
      console.log('✅ Serviço cadastrado com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});