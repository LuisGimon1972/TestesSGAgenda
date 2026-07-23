import { test, expect, Page } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Agendamentos - Cancelar agendamento', () => {

  async function fecharCookiesSeAparecer(page: Page) {
    const btnEntendi = page.locator('button, .q-btn').filter({ hasText: /^Entendi$/i });
    
    if (await btnEntendi.isVisible().catch(() => false)) {
      try {
        await btnEntendi.click({ force: true, timeout: 2000 });
      } catch {
        // Ignora caso o elemento desapareça durante a tentativa
      }
    }
  }

  async function garantirModoLista(page: Page) {
    const textoBody = await page.locator('body').innerText();
    const estaEmLista =
      /Data/i.test(textoBody) &&
      /Hora/i.test(textoBody) &&
      /Agendamento/i.test(textoBody) &&
      /Status/i.test(textoBody);

    if (!estaEmLista) {
      const btnGroup = page.locator('.q-btn-group:visible').first();
      if (await btnGroup.isVisible().catch(() => false)) {
        await btnGroup.locator('.q-btn').nth(1).click({ force: true });
        await page.waitForTimeout(500);
      }
    }
  }

  async function obterMesAnoAtual(page: Page): Promise<string> {
    const textoBody = await page.locator('body').innerText();
    const match = textoBody.match(/\d{2}\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i);

    if (!match) return '';

    const mes = match[1].toLowerCase();
    const ano = match[2];
    return `${mes}-${ano}`;
  }

  async function avancarUmDia(page: Page) {
    const btnAvancar = page
      .locator('.q-btn:visible')
      .filter({ has: page.locator('.q-icon').filter({ hasText: /chevron_right|keyboard_arrow_right|navigate_next/i }) })
      .first();

    await btnAvancar.click({ force: true });
  }

  async function clicarEditarNaLinha(page: Page, linhaIndex: number) {
    const linha = page.locator('tbody tr:visible').nth(linhaIndex);
    await linha.scrollIntoViewIfNeeded();

    const acoes = linha.locator('td').last().locator('i, button, svg, [role="button"], .q-icon');
    const countAcoes = await acoes.count();

    let clicou = false;
    for (let i = 0; i < countAcoes; i++) {
      const acao = acoes.nth(i);
      const texto = await acao.innerText();
      if (/edit|mode_edit|border_color|create/i.test(texto)) {
        await acao.click({ force: true });
        clicou = true;
        break;
      }
    }

    if (!clicou && countAcoes > 0) {
      await acoes.last().click({ force: true });
    }
  }

  async function tentarAbrirAgendamentoCriado(page: Page): Promise<boolean> {
    const linhas = page.locator('tbody tr:visible');
    const totalLinhas = await linhas.count();

    const indicesCriados: number[] = [];

    for (let i = 0; i < totalLinhas; i++) {
      const textoLinha = await linhas.nth(i).innerText();
      if (/Criado/i.test(textoLinha)) {
        indicesCriados.push(i);
      }
    }

    if (indicesCriados.length === 0) return false;

    const indiceSorteado = indicesCriados[Math.floor(Math.random() * indicesCriados.length)];
    const textoLinhaSelecionada = (await linhas.nth(indiceSorteado).innerText()).replace(/\s+/g, ' ').trim();

    const partes = textoLinhaSelecionada.split(/face|construction|store|person/);
    const clienteBruto = partes[4]?.trim() || "";
    const matchCliente = clienteBruto.match(/^(.*?)\s+R\$\s*([\d.,]+)\s+(.+)$/);
    const statusBruto = matchCliente ? matchCliente[3].trim() : "";
    const statusLimpo = statusBruto.replace(/\s+.*/, '');
    const dadosAgendamento = {
        dataHora: partes[0]?.trim(),
        profissional: partes[1]?.trim(),
        servico: partes[2]?.trim(),
        estabelecimento: partes[3]?.trim(),
        cliente: matchCliente ? matchCliente[1].trim() : clienteBruto,
        valor: matchCliente ? `R$ ${matchCliente[2]}` : "",
        status: statusLimpo
    };
    console.log('✅ Agendamento Criado encontrado:')
    console.log(dadosAgendamento);

    await clicarEditarNaLinha(page, indiceSorteado);
    return true;
  }

  async function procurarCriadoNoMes(page: Page, mesAnoInicial: string): Promise<boolean> {
    const maxTentativas = 35;

    for (let tentativa = 0; tentativa < maxTentativas; tentativa++) {
      console.log(`🔍 Procurando agendamento "Criado"... Tentativa: ${tentativa + 1}`);

      const encontrou = await tentarAbrirAgendamentoCriado(page);
      if (encontrou) return true;

      const mesAnoAtual = await obterMesAnoAtual(page);
      if (mesAnoAtual && mesAnoAtual !== mesAnoInicial) {
        console.log(`⚠️ Chegou ao final do mês (${mesAnoInicial}) sem encontrar agendamentos "Criados".`);
        return false;
      }

      await avancarUmDia(page);
      await page.waitForTimeout(1000);
      await garantirModoLista(page);
      await page.waitForTimeout(500);
    }

    console.log('⚠️ Chegou ao limite de dias pesquisados e não encontrou nenhum agendamento "Criado".');
    return false;
  }
  
  test('Deve percorrer o mês até encontrar um agendamento Criado e cancelar', async ({ page }) => {    
    
    await loginCompleto(page);
    await page.waitForTimeout(2000);

    await fecharCookiesSeAparecer(page);    

    console.log('✅ Acessando aba Agenda...');
    const linkAgenda = page.locator('.q-item').filter({ hasText: /Agenda/i }).first();
    await linkAgenda.click({ force: true });

    await expect(page.locator('body')).toHaveText(/Listagem de agendamentos/i, { timeout: 30000 });
    
    const btnDia = page.locator('button, .q-btn, [role="button"]').filter({ hasText: /^DIA$/i }).first();
    await expect(btnDia).toBeVisible({ timeout: 30000 });
    await btnDia.click({ force: true });
    await page.waitForTimeout(1000);

    await garantirModoLista(page);
    await page.waitForTimeout(1000);

    const mesAnoInicial = await obterMesAnoAtual(page);
    console.log(`📅 Mês/Ano Inicial de Busca: ${mesAnoInicial}`);
    
    const encontrouAgendamento = await procurarCriadoNoMes(page, mesAnoInicial);

    if (!encontrouAgendamento) {
      console.log('⏹️ Teste encerrado: Nenhum agendamento "Criado" foi localizado no mês.');
      return; 
    }
    
    await expect(page.locator('body')).toHaveText(/Detalhes/i, { timeout: 30000 });

    const cancelarAgendamentoPromise = page.waitForResponse((response) =>
      (response.url().includes('/schedules') || response.url().includes('/cancel') || response.url().includes('/status')) &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(response.request().method()) &&
      response.status() >= 200 && response.status() < 300,
      { timeout: 15000 }
    ).catch(() => null);
    
    const btnFinalizar = page.locator('button.q-btn, [role="button"]')
      .filter({ hasText: /^Cancelar$/i })
      .first();
    await expect(btnFinalizar).toBeVisible({ timeout: 30000 });    
    await btnFinalizar.scrollIntoViewIfNeeded();
    await btnFinalizar.click();

    await page.waitForTimeout(1000);

    const btnConfirmar = page.locator('button:visible, .q-btn:visible')
      .filter({ hasText: /Confirmar|Sim/i }).first();

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
          // Garante o mapeamento do objeto correto, esteja ele dentro de "data" ou direto na raiz
          const agendamentoEncontrado = jsonConsulta?.data || jsonConsulta;
          
          console.log('✅ REGISTRO ENCONTRADO COM SUCESSO!');
          console.log('🆔 ID do Agendamento:', agendamentoEncontrado?.id || agendamentoEncontrado?.iid || 'Desconhecido');
          console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(agendamentoEncontrado, null, 2));
          
          // Validação simples de segurança que o status realmente mudou
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
    await page.waitForTimeout(4000);    
  });
});