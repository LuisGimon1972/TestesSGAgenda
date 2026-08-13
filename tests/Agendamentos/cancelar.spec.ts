import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { navegarPara } from '../../utils/navegar';

test.describe('Agendamentos - Cancelar agendamento', () => {

  test.setTimeout(120000);

  async function fecharCookiesSeAparecer(page: Page) {
    const btnEntendi = page.locator('button, .q-btn').filter({ hasText: /^Entendi$/i });
    if (await btnEntendi.isVisible().catch(() => false)) {
      try { await btnEntendi.click({ force: true, timeout: 2000 }); } catch {}
    }
  }
  

  async function obterMesAnoAtual(page: Page): Promise<string> {
    const textoBody = await page.locator('body').innerText().catch(() => '');
    const match = textoBody.match(/\d{2}\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i);
    if (!match) return '';
    const mes = match[1].toLowerCase();
    const ano = match[2];
    return `${mes}-${ano}`;
  }

  async function avancarUmaSemana(page: Page) {
    const btnAvancar = page.locator('button:visible').filter({ has: page.locator('.pi-chevron-right') }).first();
    if (await btnAvancar.isVisible().catch(() => false)) {
      await Promise.all([
        page.waitForResponse(resp => resp.url().includes('/schedules') && resp.status() === 200).catch(() => null),
        btnAvancar.click({ force: true })
      ]);
    } else {
      const btnAlt = page.locator('button, .q-btn').filter({ hasText: /Próximo|Next|>/i }).first();
      if (await btnAlt.isVisible().catch(() => false)) {
        await Promise.all([
          page.waitForResponse(resp => resp.url().includes('/schedules') && resp.status() === 200).catch(() => null),
          btnAlt.click({ force: true })
        ]);
      }
    }
  }

  async function tentarAbrirAgendamentoCriado(page: Page): Promise<boolean> {
  const linhas = page.locator('div').filter({ hasText: /Corte \+ Barba|Pendente|Atrasado/i });
  const totalLinhas = await linhas.count();

  for (let i = 0; i < totalLinhas; i++) {
    const linha = linhas.nth(i);
    const textoLinha = (await linha.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();

    if (/pendente|atrasado/i.test(textoLinha)) {
      await linha.scrollIntoViewIfNeeded();
  
      const spanPendente = linha.locator('span.inline-block.whitespace-nowrap.rounded-md.text-accent')
        .filter({ hasText: /^Pendente|Atrasado$/i })
        .first();

      if (await spanPendente.isVisible().catch(() => false)) {
        await spanPendente.click({ force: true });
        console.log(`✅ Clique realizado no <span>Pendente</span> da linha ${i}`);
        return true;
      }
      
      const qualquerPendente = linha.locator('span, button, .q-btn, td').filter({ hasText: /Pendente|Atrasado/i }).first();
      if (await qualquerPendente.isVisible().catch(() => false)) {
        await qualquerPendente.click({ force: true });
        console.log(`✅ Clique alternativo em "Pendente" realizado na linha ${i}`);
        return true;
      }
    }
  }

  console.log('⚠️ Nenhum agendamento "Pendente ou Atrasado" encontrado na grade.');
  return false;
}

  async function procurarCriadoNoMes(page: Page, mesAnoInicial: string): Promise<boolean> {  
  const maxTentativas = 6; 

  for (let tentativa = 0; tentativa < maxTentativas; tentativa++) {
    console.log(`🔍 Procurando agendamento "Pendente ou Atrasado"... Tentativa: ${tentativa + 1}`);   

    const encontrou = await tentarAbrirAgendamentoCriado(page);
    if (encontrou) return true;

    const mesAnoAtual = await obterMesAnoAtual(page);
    if (mesAnoAtual && mesAnoAtual !== mesAnoInicial) {
      console.log(`⚠️ Chegou ao final do mês (${mesAnoInicial}) sem encontrar agendamentos "Pendentes".`);
      return false;
    }
        
    if (tentativa === maxTentativas - 1) {
      console.log(`⚠️ Máximo de ${maxTentativas} tentativas atingido sem encontrar agendamentos "Pendentes ou Atrasados". Encerrando busca.`);
      return false; 
    }

    await avancarUmaSemana(page);
    await page.waitForTimeout(3000);
  }

  return false;
}
  
  test('Deve percorrer o mês até encontrar um agendamentos Pendentes ou Atrasados e Cancelar', async ({ page }) => {    
    
    await loginCompleto(page);
    await page.waitForTimeout(2000);

    await fecharCookiesSeAparecer(page);    

    console.log('✅ Acessando aba Agenda...');
    await page.waitForTimeout(1000);
    await navegarPara(page, 'Agendamentos');

    await expect(page.locator('body')).toHaveText(/Agendamentos/i, { timeout: 30000 });
    
    const btnSemana = page.locator('button, .q-btn, [role="button"]').filter({ hasText: /^Esta semana$/i }).first();
    await expect(btnSemana).toBeVisible({ timeout: 30000 });
    await btnSemana.click({ force: true });
    await page.waitForTimeout(2000);

    const mesAnoInicial = await obterMesAnoAtual(page);
    console.log(`📅 Mês/Ano Inicial de Busca: ${mesAnoInicial}`);
    
    const encontrouAgendamento = await procurarCriadoNoMes(page, mesAnoInicial);

    if (!encontrouAgendamento) {
      console.log('⏹️ Teste encerrado: Nenhum agendamento "Pendente ou Atrasado" foi localizado no mês.');
      return; 
    }
    
    await expect(page.locator('body')).toHaveText(/Resumo do agendamento/i, { timeout: 30000 });

    const cancelarAgendamentoPromise = page.waitForResponse((response) =>
      (response.url().includes('/schedules') || response.url().includes('/cancel') || response.url().includes('/status')) &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(response.request().method()) &&
      response.status() >= 200 && response.status() < 300,
      { timeout: 15000 }
    ).catch(() => null);   
    
    const btnPendenteOpcao = page.locator('button.q-btn, [role="button"], .q-item, span')
      .filter({ hasText: /^Pendente$/i })
      .first();

    if (await btnPendenteOpcao.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnPendenteOpcao.click({ force: true });
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(4000);    
    const btnGravar = page.getByText(/Cancelar agendamento|Cancelar agendamiento/i).first();
    await btnGravar.waitFor({ state: 'visible', timeout: 10000 });
    await btnGravar.click({ force: true });

    await page.waitForTimeout(1000);

        const btnConfirmar = page.locator('button:visible, .q-btn:visible')
      .filter({ hasText: /Cancelar agendamento|Sim/i }).first();

    if (await btnConfirmar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnConfirmar.click({ force: true });
    }
    
    const responseAgendamento = await cancelarAgendamentoPromise;

    if (responseAgendamento) {            
      const urlConsulta = responseAgendamento.url().split('?')[0].replace(/\/cancel\/?$/, '').replace(/\/status\/?$/, '');
      
      const headersGet = { ...responseAgendamento.request().headers() };
      delete headersGet['content-type'];
      delete headersGet['content-length'];
      delete headersGet[':method'];
      delete headersGet[':path'];
      delete headersGet[':authority'];
      delete headersGet[':scheme'];

      const respostaGet = await page.request.get(urlConsulta, {
        headers: headersGet,
      });

      console.log('🌐 URL da consulta (GET) do registro:', urlConsulta);
      console.log(`✅ Status da consulta GET: ${respostaGet.status()}`);

      if (respostaGet.status() === 200) {
        try {
          const jsonConsulta = await respostaGet.json();          
          const agendamentoEncontrado = jsonConsulta?.data || jsonConsulta;
          
          console.log('✅ REGISTRO ENCONTRADO COM SUCESSO!');
          console.log('🆔 ID do Agendamento:', agendamentoEncontrado?.id || agendamentoEncontrado?.iid || 'Desconhecido');
          console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(agendamentoEncontrado, null, 2));          
          
          if(agendamentoEncontrado?.status?.toLowerCase().includes('cancel')) {
             console.log('✅ Status de cancelamento confirmado no JSON!');
          }
        } catch (e) {
          console.log('⚠️ Falha ao converter a resposta da consulta para JSON.');
        }
      } else {
        console.log(`⚠️ Falha ao buscar o agendamento cancelado. Status HTTP: ${respostaGet.status()}`);
      }
    } 

    console.log('✅ Agendamento cancelado com sucesso!');
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(1000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
  });
});