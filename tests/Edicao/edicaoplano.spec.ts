import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { obterNomePlanoAleatorio } from '../../utils/listagemplanos';
import { navegarPara } from '../../utils/navegar';

test.describe('Teste de Edição de Planos', () => {

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

    await navegarPara(page, 'Planos');
    console.log(`✅ Clicou em Planos`);              
    console.log(`✅ Apareceu Listagem de Planos`);    
    
    await page.waitForTimeout(500);       

    await expect(page.getByText(/Planos/i).first()).toBeVisible({ timeout: 30000 });
    await page.waitForSelector('tbody', { state: 'visible', timeout: 15000 }).catch(() => {});
  });

  test('Deve selecionar aleatoriamente um serviço da lista e abrir edição.', async ({ page }) => {   
    
    
    await page.waitForTimeout(1000);

    const linhas = page.locator('tbody tr');
    const totalLinhas = await linhas.count();

    if (totalLinhas === 0) {
      console.log('⚠️ A grade de planos não possui registros (0 linhas). Teste ignorado (skipped).');
      test.skip();
      return;
    }    
    
    const textoPrimeiraLinha = await linhas.first().innerText();
    if (/Cadastrar primeiro|Nenhum|Sem registro|No data/i.test(textoPrimeiraLinha)) {
      console.log(`⚠️ Grade vazia detectada: "${textoPrimeiraLinha.trim().split('\n')[0]}". Teste ignorado (skipped).`);
      test.skip(); 
      return;
    }

    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const nomePlanoe = (await linhaSelecionada.locator('td').nth(0).innerText()).trim();
    console.log(`✅ Plano selecionado: ${nomePlanoe}`);        
    
    const btnEditar = linhaSelecionada
      .locator([
        'button:has-text("edit")',
        'button:has-text("editar")',
        'a:has-text("edit")',
        'a:has-text("editar")',
        'i:has-text("edit")',
        'i:has-text("editar")',
        '[title*="edit" i]',
        '[title*="editar" i]',
        '[aria-label*="edit" i]',
        '[aria-label*="editar" i]',
        '.q-btn:has(.q-icon)',
        'td:last-child button',
        'td:last-child a'
      ].join(', '))
      .nth(0);
    
    await btnEditar.waitFor({ state: 'visible', timeout: 5000 });
    await btnEditar.scrollIntoViewIfNeeded().catch(() => {});
    await btnEditar.click({ force: true });

    await page.waitForTimeout(1000); 
    
    const salvarPlanoPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/plans') || response.url().includes('/plano')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
    ).catch(() => null);
    
    const nomePlano = `${obterNomePlanoAleatorio()} ${Date.now()}`;    
    const valorPlano = (Math.floor(Math.random() * 1201) + 1850).toString();
    const duracao = (Math.floor(Math.random() * 6) + 1).toString();
    const descricaoPlano = `Plano que oferece recursos essenciais, segurança, suporte e atualizações para uma gestão mais eficiente e produtiva.`;    
    
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
      try {
        const camposVisiveis = page.locator('input:visible');
        const qtdCampos = await camposVisiveis.count();
     
        if (index >= qtdCampos) {
          console.log(`⚠️ Campo "${nomeCampo}" (índice ${index}) não encontrado na tela (total: ${qtdCampos}). Ignorado.`);
          return;
        }

        const campo = camposVisiveis.nth(index);       
        await campo.waitFor({ state: 'visible', timeout: 5000 });                              
        await campo.clear();        
        await page.waitForTimeout(100);
        
        if (texto) {        
          await campo.fill(texto); 
        }

        if (nomeCampo.includes('Valor')) {
          console.log(`✅ ${nomeCampo}: ${Number(texto) / 100}`);
        } else if (nomeCampo) {
          console.log(`✅ ${nomeCampo}: ${texto}`);          
        }
        
      } catch (e) {
        console.error(`❌ Falha ao tentar preencher o campo: ${nomeCampo}`);
      }
    };
    
    await preencherCampo(0, nomePlano, 'Novo Nome do Plano');    
    await preencherCampo(1, valorPlano, 'Novo Valor do Plano');    
    await preencherCampo(2, duracao, 'Nova Duração do Plano');    

    const selectsVisiveis = page.locator('.q-select:visible');
    const totalSelects = await selectsVisiveis.count();
    
    if (totalSelects > 0) {
      await selectsVisiveis.nth(0).click().catch(() => {});
      const primeiraOpcao = page.locator('(//div[contains(@class,"q-menu")]//*[contains(@class,"q-item")])[1]');
      if (await primeiraOpcao.isVisible({ timeout: 3000 }).catch(() => false)) {
        const nomeOpcao = await primeiraOpcao.innerText();
        await primeiraOpcao.click();
        console.log('✅ Selecionou Recorrência/Período:', nomeOpcao.trim().toUpperCase());
      }
    }

    await page.waitForTimeout(500);
    
    if (totalSelects > 1) {
      await selectsVisiveis.nth(1).click().catch(() => {});
      const segundaOpcao = page.locator('(//div[contains(@class,"q-menu")]//*[contains(@class,"q-item")])[1]');
      if (await segundaOpcao.isVisible({ timeout: 3000 }).catch(() => false)) {
        const nomeOpcao2 = await segundaOpcao.innerText();
        await segundaOpcao.click();
        console.log('✅ Selecionou 2º Período:', nomeOpcao2.trim().toUpperCase());
      }
    }
    
    const campoDescricao = page.locator('textarea:visible').first();
    if (await campoDescricao.isVisible().catch(() => false)) {
      await campoDescricao.scrollIntoViewIfNeeded();
      await campoDescricao.click({ force: true });
      await campoDescricao.fill(descricaoPlano.toUpperCase(), { force: true });
      console.log('✅ Descrição do Plano Alterado:', descricaoPlano.toUpperCase());
    }

    await page.waitForTimeout(500);       

    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');                 

    let respostaJson: any = null;
    const salvarResponse = await salvarPlanoPromise;    

    if (salvarResponse) {
      console.log('🌐 A URL capturada do POST/PUT é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);

      try {        
        respostaJson = await salvarResponse.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJson, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }
    }    
    
    let idPlano = respostaJson?.data?.id?.toString()?.trim() || respostaJson?.id?.toString()?.trim();
    
    if (!idPlano && salvarResponse) {
      const urlInterceptada = salvarResponse.url();      
      const uuidMatch = urlInterceptada.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      
      if (uuidMatch) {
        idPlano = uuidMatch[0];
      } else {        
        const partes = urlInterceptada.split('?')[0].split('/');
        idPlano = partes[partes.length - 1];
      }
    }
    
    if (salvarResponse && idPlano) {     
      const urlSemQuery = salvarResponse.url().split('?')[0];
      
      const urlRegistroCriado = urlSemQuery.endsWith(idPlano) 
        ? urlSemQuery 
        : `${urlSemQuery}/${idPlano}`;      
        
      const headersGetRegistro = { ...salvarResponse.request().headers() };      
      delete headersGetRegistro['content-type'];
      delete headersGetRegistro['content-length'];
      delete headersGetRegistro[':method'];
      delete headersGetRegistro[':path'];
      delete headersGetRegistro[':authority'];
      delete headersGetRegistro[':scheme'];      
      
      const getCriadoResponse = await page.request.get(urlRegistroCriado, {
        headers: headersGetRegistro,
      });

      console.log('🌐 URL do registro atualizado:', urlRegistroCriado);
      console.log('✅ RESPOSTA DA API AO CONSULTAR O REGISTRO');
      console.log('✅ ID do Registro:', idPlano);    
      console.log(`✅ Status GET: ${getCriadoResponse.status()}`);

      try {
        const dadosCriado = await getCriadoResponse.json();
        console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(dadosCriado, null, 2));
      } catch (error) {
        console.error('⚠️ Erro ao converter resposta para JSON no GET:', error);
      }
    } else {
      console.log('⚠️ Não foi possível identificar o ID do registro na URL nem no JSON.');
    }        
    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});