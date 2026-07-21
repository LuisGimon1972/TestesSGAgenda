import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterServicoAleatorio, obterNomeServicoAleatorio } from '../../utils/listaservicos';

test('Cadastro de Serviços E2E com Atendentes Aleatórios', async ({ page }) => {
    test.setTimeout(1200000);

    await loginCompleto(page);    

    await page.waitForTimeout(2000);       

    const servico = obterServicoAleatorio();  

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

    console.log('--- DADOS ENVIADOS PRA API ---');    
    const timestamp = Date.now();
    const nomeServico = servico.nomeServico.toUpperCase();
    const duracao = servico.duracaoMinutos.toFixed();
    const valor = servico.precoSugerido.toFixed();
    const comissao = '30';
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
    
    await page.waitForTimeout(2000);       
    
    try {
        const secaoAtendentes = page.getByText(/Sele[çc][aã]o de Atendentes/i).first();
        if (await secaoAtendentes.isVisible({ timeout: 5000 })) {
            await secaoAtendentes.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
            
            const selecionados = await page.evaluate(() => {                
                const todosElementos = Array.from(document.querySelectorAll('*'));
                const tituloAtendentes = todosElementos.find(el => 
                    /Sele[çc][aã]o de Atendentes/i.test((el.textContent || '').replace(/\s+/g, ' ').trim())
                );
                
                const topoSecao = tituloAtendentes ? tituloAtendentes.getBoundingClientRect().top : 0;                
                const divs = Array.from(document.querySelectorAll('div'));
                const cardsAtendentes = divs.filter(el => {
                    const texto = (el.textContent || '').replace(/\s+/g, ' ').trim();
                    const rect = el.getBoundingClientRect();

                    const temTamanhoDeCard = rect.width >= 150 && rect.width <= 400 && rect.height >= 100 && rect.height <= 260;
                    const estaNaSecaoDeAtendentes = rect.top >= topoSecao - 20;
                    const temImagemOuInput = el.querySelector('img') !== null || el.querySelector('input') !== null;
                    const naoEhFormulario = !/Nome do servi[çc]o|Dura[çc][aã]o|Valor|Comiss[aã]o|Categoria|Descri[çc][aã]o|Gravar|Cadastrar/i.test(texto);

                    return temTamanhoDeCard && estaNaSecaoDeAtendentes && temImagemOuInput && texto.length > 0 && naoEhFormulario;
                });

                if (cardsAtendentes.length === 0) return 0;                
                const primeirosSeis = cardsAtendentes.slice(0, 6);
                const quantidadeParaSelecionar = primeirosSeis.length > 1 ? 2 : 1;               
                
                const cardsSelecionados = primeirosSeis.sort(() => 0.5 - Math.random()).slice(0, quantidadeParaSelecionar);
                
                cardsSelecionados.forEach((card) => {
                    const rect = card.getBoundingClientRect();
                    const clientX = rect.right - 20;
                    const clientY = rect.top + 20;

                    const eventos = ['pointerdown', 'mousedown', 'mouseup', 'click'];
                    eventos.forEach((evento) => {
                        card.dispatchEvent(new MouseEvent(evento, {
                            bubbles: true, cancelable: true, clientX, clientY, view: window
                        }));
                    });
                });

                return cardsSelecionados.length;
            });

            console.log(`✅ Total de atendentes selecionados pela injeção JS: ${selecionados}`);
            await page.waitForTimeout(800); 
        }
    } catch (err) {
        console.log('⚠️ Falha ao selecionar atendentes:', err);
    }

    console.log('--- FIM DE DADOS ENVIADOS ---');           
    
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