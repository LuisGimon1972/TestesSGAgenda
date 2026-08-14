import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { obterServicoAleatorio } from '../../utils/listaservicos';
import { navegarPara } from '../../utils/navegar';

test.describe('Teste de Edição de Serviços', () => {

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

    await navegarPara(page, 'Catálogo', '');    
    console.log(`✅ Clicou em Serviços`);          
    console.log(`✅ Apareceu Listagem de serviços`);    
    
    await page.waitForTimeout(500);       

    await expect(page.getByText(/Serviços/i).first()).toBeVisible({ timeout: 30000 });
    // Aguarda apenas o tbody genérico, não força o erro se a linha (tr) não existir
    await page.waitForSelector('tbody', { state: 'visible', timeout: 15000 }).catch(() => {});
  });

  test('Deve selecionar aleatoriamente um serviço da lista e abrir edição.', async ({ page }) => {   
    
    // Pequena pausa para garantir que os dados renderizaram na tabela
    await page.waitForTimeout(3000);

    const linhas = page.locator('tbody tr');
    const totalLinhas = await linhas.count();

    // 1. Validação de Grade Completamente Vazia (0 linhas)
    if (totalLinhas === 0) {
      console.log('⚠️ A grade de serviços não possui registros (0 linhas). Teste ignorado (skipped).');
      test.skip();
      return;
    }
    
    // 2. Validação de texto de lista vazia dentro da linha (<tr>)
    const textoPrimeiraLinha = await linhas.first().innerText();
    if (/Cadastrar primeiro|Nenhum|Sem registro|No data/i.test(textoPrimeiraLinha)) {
      console.log(`⚠️ Grade vazia detectada: "${textoPrimeiraLinha.trim().split('\n')[0]}". Teste ignorado (skipped).`);
      test.skip(); 
      return;
    }
    
    // Se passou pelas validações, existem serviços reais para selecionar
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);    
    
    await page.waitForTimeout(1000);     

    const nomeServico = (await linhaSelecionada.locator('td').nth(1).innerText()).trim();
    console.log(`✅ Serviço selecionado: ${nomeServico}`);    

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
    
    const salvarServicoPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/services') || response.url().includes('/servico')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
    ).catch(() => null);
    
    const nomeServicoX = `${obterServicoAleatorio().nomeServico}`;
    const duracao = '15';
    const valor = '3500';    
    const comissao = '5000';      
    const descricao = `Serviço realizado com técnicas adequadas para atender às preferências e necessidades de cada cliente. O atendimento inclui avaliação do estilo desejado, execução do corte e acabamento, proporcionando um visual renovado, bem cuidado e alinhado.`;
    
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
      try {
        const campo = page.locator('input:visible').nth(index);       
        
        await campo.waitFor({ state: 'visible', timeout: 10000 });                              
        await campo.clear();        
        await page.waitForTimeout(100);
        
        if (texto) {        
          await campo.fill(texto); 
        }

        // Correção do console.log: Removida a divisão por 100 em índices errados para evitar "NaN%"
        if (nomeCampo.includes('Comissão')) {
          console.log(`✅ ${nomeCampo}: ${Number(texto) / 100}%`);
        } else if (nomeCampo) {
          console.log(`✅ ${nomeCampo}: ${texto}`);
        }
        
      } catch (e) {
        console.error(`❌ Falha ao tentar preencher o campo: ${nomeCampo}`, e);
      }
    };
    
    await preencherCampo(2, nomeServicoX, 'Nome de Serviço Alterado');
    await preencherCampo(3, duracao, 'Duração Alterada');
    await preencherCampo(4, valor, 'Valor Alterado');    
    await preencherCampo(5, comissao, 'Comissão Alterada');        
    
    const campoDescricao = page.locator('textarea:visible').first();
    await campoDescricao.scrollIntoViewIfNeeded();
    await campoDescricao.click({ force: true });
    await campoDescricao.fill(descricao.toUpperCase(), { force: true });
    console.log('✅ Descrição do Serviço Alterada:', descricao.toUpperCase());

    await page.waitForTimeout(500);       

    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');                 

    let respostaJson: any = null;
    const salvarResponse = await salvarServicoPromise;    

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
    
    let idServico = respostaJson?.data?.id?.toString()?.trim() || respostaJson?.id?.toString()?.trim();
    
    if (!idServico && salvarResponse) {
      const urlInterceptada = salvarResponse.url();      
      const uuidMatch = urlInterceptada.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      
      if (uuidMatch) {
        idServico = uuidMatch[0];
      } else {        
        const partes = urlInterceptada.split('?')[0].split('/');
        idServico = partes[partes.length - 1];
      }
    }
    
    if (salvarResponse && idServico) {     
      const urlSemQuery = salvarResponse.url().split('?')[0];
      
      const urlRegistroCriado = urlSemQuery.endsWith(idServico) 
        ? urlSemQuery 
        : `${urlSemQuery}/${idServico}`;      
        
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
      console.log('✅ ID do Registro:', idServico);    
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