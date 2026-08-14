import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { navegarPara } from '../../utils/navegar';

test.describe('Teste de Edição de Atendentes', () => {

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

    await navegarPara(page, 'Profissionais');

    await expect(page.getByText(/Profissionais/i).first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);   
  });

  test('Deve selecionar aleatoriamente um atendente da lista e abrir edição.', async ({ page }) => {
    const linhas = page.locator('tbody tr');   

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 atendente').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    await page.waitForTimeout(2000); 
    
    const nomeAtendentee = (await linhaSelecionada.locator('td').nth(0).innerText()).trim();
    console.log(`✅ Atendente selecionado: ${nomeAtendentee}`);
    
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

    console.log('📝 DADOS ENVIADOS PRA API');
    
    await btnEditar.waitFor({ state: 'visible', timeout: 5000 });
    await btnEditar.scrollIntoViewIfNeeded().catch(() => {});
    await btnEditar.click({ force: true });      
    
    console.log('✅ Clicou no botão Editar da linha');

    await page.waitForTimeout(1000); 

    const salvarAtendentePromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/service-providers') || response.url().includes('/atendente')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
    ).catch(() => null);

    await page.waitForTimeout(1000); 
    
    const nomeAtendente = obterNomePessoaAleatorio();        
    const nomeAtendenteLimpo = (nomeAtendente || '').trim();
    
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
      try {
        const campo = page.locator('input:visible').nth(index);       
        await campo.waitFor({ state: 'visible', timeout: 10000 });                              
        await campo.clear();        
        await page.waitForTimeout(100);
        
        if (texto) {        
          await campo.fill(texto); 
        }

        if (index === 2 || index === 3) {
          console.log(`✅ ${nomeCampo}: ${Number(texto) / 100}%`);
        } else if (nomeCampo) {
          console.log(`✅ ${nomeCampo}: ${texto}`);
        }
      } catch (e) {
        console.error(`❌ Falha ao tentar preencher o campo: ${nomeCampo}`, e);
      }
    };

    await preencherCampo(2, nomeAtendenteLimpo, 'Novo Nome do Atendente');
    await preencherCampo(3, '4500', 'Novo valor de Comissão de Serviços');
    await preencherCampo(4, '5600', 'Novo valor de Comissão de Produtos');

    await page.waitForTimeout(2000);       
    
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    } catch (e) {}
    console.log('📝 FIM DE DADOS ENVIADOS PRA API');

    const btnGravar = page.getByText(/Gravar alterações/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');              

    let respostaJson: any = null;
    const salvarResponse = await salvarAtendentePromise;    

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
    
    let idAtendente = respostaJson?.data?.id?.toString()?.trim() || respostaJson?.id?.toString()?.trim();
    
    if (!idAtendente && salvarResponse) {
      const urlInterceptada = salvarResponse.url();      
      const uuidMatch = urlInterceptada.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      
      if (uuidMatch) {
        idAtendente = uuidMatch[0];
      } else {
        // Fallback: pega a última parte da URL após a barra "/"
        const partes = urlInterceptada.split('?')[0].split('/');
        idAtendente = partes[partes.length - 1];
      }
    }
    
    if (salvarResponse && idAtendente) {     
      const urlSemQuery = salvarResponse.url().split('?')[0];
      
      const urlRegistroCriado = urlSemQuery.endsWith(idAtendente) 
        ? urlSemQuery 
        : `${urlSemQuery}/${idAtendente}`;      
        
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
      console.log('✅ ID do Registro:', idAtendente);    
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
    
    await expect(page.locator('body')).toHaveText(
      /Cadastrar atendente|Editar atendente|Nome completo|E-mail|Gravar/i,
      { timeout: 30000 }
    );

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});