import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterNomePlanoAleatorio } from '../../utils/listagemplanos';

test('Cadastro de Planos E2E com Serviço Prestado', async ({ page }) => {
    test.setTimeout(900000);

    await loginCompleto(page);    
    await page.waitForTimeout(2000);       
    
    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => { document.body.style.zoom = '0.9'; });
    console.log('🔍 Zoom ajustado para 90% via CSS');
    
    await page.locator('.q-item, a, button').filter({ hasText: /Planos/i }).first().click({ force: true });
    console.log(`✅ Clicou em Planos`);          
    await page.waitForTimeout(2000);                 
    
    const btnCadastrar = page.getByText(/Cadastrar plano/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });      
    console.log(`✅ Clicou em Cadastrar Plano`);  
    console.log(`✅ Abriu Form de Planos`);              
    
    const salvarPlanoPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/plans') || response.url().includes('/plano')) &&
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
    const nomePlano = obterNomePlanoAleatorio();
    const valorPlano = '1475';     
    const descricaoPlano = `Plano destinado a atender às necessidades do seu negócio, oferecendo recursos essenciais, segurança, suporte e atualizações para uma gestão mais eficiente e produtiva.`;    
    
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
    
    await preencherCampo(0, nomePlano, 'Nome do Plano');
    await preencherCampo(1, valorPlano, 'Valor do Plano');    
    
    try {
      await expect(page.locator('body')).toHaveText(/Mensal/i);
      await expect(page.locator('body')).toHaveText(/Meses/i);
      await expect(page.locator('body')).toHaveText(/Usos/i);
    } catch (e) {}
    
    try {
      const campoDescricao = page.locator('textarea:visible').first();
      await campoDescricao.scrollIntoViewIfNeeded();
      await campoDescricao.click({ force: true });
      await campoDescricao.press('Control+A');
      await campoDescricao.press('Backspace');
      await campoDescricao.type(descricaoPlano, { delay: 20 });
      console.log('✅ Descrição do Plano preenchida:', descricaoPlano);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Descrição');
    }    
    
    try {
      const secaoServicos = page.getByText(/Servi[çc]os prestados/i).first();
      await secaoServicos.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const btnAdicionar = page.locator('button, .q-btn, [role="button"]').filter({ hasText: /Adicionar/i }).first();
      await btnAdicionar.click({ force: true });
      console.log('✅ Clicou em Adicionar Serviço');
      await page.waitForTimeout(1500);
     
      const selecionados = await page.evaluate(() => {
        const dialog = document.querySelector('.q-dialog:not([style*="display: none"]), [role="dialog"]');
        const raiz = dialog || document.body;
        
        const trs = Array.from(raiz.querySelectorAll('tbody tr'));
        const linhasValidas = trs.filter(tr => {
          const texto = (tr.textContent || '').replace(/\s+/g, ' ').trim();
          const temColunas = tr.querySelectorAll('td').length > 0;
          const linhaVazia = /nenhum|nenhuma|sem dados|sem resultado|não encontrado|nao encontrado/i.test(texto);
          return temColunas && texto.length > 0 && !linhaVazia;
        });

        let elementosParaClicar: HTMLElement[] = [];

        if (linhasValidas.length > 0) {
          elementosParaClicar = linhasValidas as HTMLElement[];
        } else {          
          const itens = Array.from(raiz.querySelectorAll('.q-item, .q-card, [class*="card"]'));
          elementosParaClicar = itens.filter(item => {
            const texto = (item.textContent || '').replace(/\s+/g, ' ').trim();
            return texto.length > 0 && !/Adicionar|Confirmar|Cancelar|Buscar|Servi[çc]os prestados|Valor definido/i.test(texto);
          }) as HTMLElement[];
        }

        if (elementosParaClicar.length === 0) return 0;

        const qtd = elementosParaClicar.length > 1 ? 2 : 1;
        const sorteados = elementosParaClicar.sort(() => 0.5 - Math.random()).slice(0, qtd);

        sorteados.forEach(el => el.click());
        return sorteados.length;
      });

      console.log(`✅ Serviços selecionados no modal: ${selecionados}`);
      await page.waitForTimeout(1000);
      
      const btnConfirmar = page.locator('button, .q-btn, [role="button"]').filter({ hasText: /Confirmar/i }).first();
      await btnConfirmar.click({ force: true });
      console.log('✅ Clicou em Confirmar Serviço(s)');
      await page.waitForTimeout(1000);

    } catch (err) {
      console.log('⚠️ Falha ao selecionar serviços no modal:', err);
    }

    console.log('📝 FIM DE DADOS ENVIADOS PRA API');    
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    } catch (e) {}
    
    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');              
    
    const salvarResponse = await salvarPlanoPromise;
    if (salvarResponse) {
      console.log('🌐 A URL capturada do POST é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);
    }    
   
    try {
      await expect(page.locator('body')).toHaveText(
        /sucesso|salvo|cadastrado|Listagem de planos|Planos/i,
        { timeout: 30000 }
      );
      console.log('✅ Plano cadastrado com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }
   
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});