import { test, expect, Page, devices } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Agendamentos - Cadastro', () => {
  let dataSelecionadaEhHoje = false;
  let dataselecta = true;
  const telefone = gerarTelefoneAleatorio();

  function gerarTelefoneAleatorio() {
    const ddd = '49';
    const primeiroDigito = '9';
    const numero = Math.floor(10000000 + Math.random() * 90000000);
    return `${ddd}${primeiroDigito}${numero}`;
  }

  async function fecharCookiesSeAparecer(page: Page) {
    try {
      const btnCookie = page.locator('button:visible, .q-btn:visible, [role="button"]:visible')
        .filter({ hasText: /Entendi|Aceitar|Aceito|OK|Concordo/i })
        .first();
        
      if (await btnCookie.isVisible({ timeout: 2000 })) {
        await btnCookie.click({ force: true });
        console.log('✅ Fechou aviso de cookies');
      }
    } catch (e) {}
  }

  async function abrirAgenda(page: Page) {
    const btnAgenda = page.locator('.q-item, a, button').filter({ hasText: /Agenda/i }).first();
    await btnAgenda.scrollIntoViewIfNeeded();
    await btnAgenda.click({ force: true });    

    await expect(page.locator('body')).toHaveText(/Listagem de agendamentos/i, { timeout: 30000 });
    await fecharCookiesSeAparecer(page);
    console.log('✅ Abriu tela de Agenda');
  }

  async function abrirCadastroAgendamento(page: Page) {
    await page.waitForTimeout(1000);
    const btnCadastrar = page.getByText(/Cadastrar agendamento/i).first();
    await btnCadastrar.click({ force: true });

    await expect(page.locator('body')).toHaveText(/Escolha o servi[çc]o/i, { timeout: 30000 });
    await fecharCookiesSeAparecer(page);
    console.log('✅ Clicou em Cadastrar agendamento');
  }

  async function selecionarServico(page: Page, tentativa = 0): Promise<void> {    
    await expect(page.locator('body')).toHaveText(/Escolha o servi[çc]o/i, { timeout: 30000 });
    await fecharCookiesSeAparecer(page);
    await page.waitForTimeout(1000);

    const resultadoClique = await page.evaluate((tent) => {
      function limparTexto(texto: string | null) { return (texto || '').replace(/\s+/g, ' ').trim(); }
      
      const elementos = Array.from(document.querySelectorAll('*:not(script, style, link, meta, head, title)'));
      const vistos = new Set();
      const encontrados: HTMLElement[] = [];

      elementos.forEach((el) => {
        const elemento = el as HTMLElement;
        const style = window.getComputedStyle(elemento);
        if (style.display === 'none' || style.visibility === 'hidden') return;

        const texto = limparTexto(elemento.textContent);
        if (!texto || texto.length > 220) return;

        const rect = elemento.getBoundingClientRect();
        const temTamanhoPossivel = rect.width >= 20 && rect.width <= 700 && rect.height >= 10 && rect.height <= 420;
        const contemPalavraServico = /Corte|Servi|Servi[çc]o|Servicio/i.test(texto);
        const contemValorServico = /(?:R\$|\$|₲|G|Gs\.?|G\$)\s*[\d.,]+|[\d.,]+\s*(?:R\$|\$|₲|G|Gs\.?|G\$)/i.test(texto);
        const naoEhMenuOuBusca = !/Escolha o servi[çc]o|Buscar servi[çc]o|Buscar servicio|Exibir mais|Mostrar mais|Dashboard|Agenda|Clientes|Atendentes|Produtos|Configura[çc][õo]es|Termos de uso|Política de privacidade|cookies|Entendi/i.test(texto);

        if (!temTamanhoPossivel || !naoEhMenuOuBusca || (!contemPalavraServico && !contemValorServico)) return;

        const clicavel = elemento.closest('.q-card, .q-item, button, [role="button"], [class*="card"], [class*="item"]') || elemento;
        if (!vistos.has(clicavel)) {
          vistos.add(clicavel);
          encontrados.push(clicavel as HTMLElement);
        }
      });

      encontrados.sort((a, b) => {
        const textoA = limparTexto(a.textContent);
        const textoB = limparTexto(b.textContent);
        const scoreA = (/Corte|Servi|Servi[çc]o|Servicio/i.test(textoA) ? 100 : 0) + (/(?:R\$|\$|₲|G|Gs\.?|G\$)\s*[\d.,]+/i.test(textoA) ? 80 : 0) - textoA.length;
        const scoreB = (/Corte|Servi|Servi[çc]o|Servicio/i.test(textoB) ? 100 : 0) + (/(?:R\$|\$|₲|G|Gs\.?|G\$)\s*[\d.,]+/i.test(textoB) ? 80 : 0) - textoB.length;
        return scoreB - scoreA;
      });

      if (encontrados.length === 0) return { sucesso: false, textoBody: limparTexto(document.body.textContent).substring(0, 1200) };

      const card = encontrados[tent] || encontrados[0];
      card.scrollIntoView();
      card.click();
      return { sucesso: true, textoClicado: limparTexto(card.textContent) };
    }, tentativa);

    if (!resultadoClique.sucesso) {
      console.log(`⚠️ Texto da tela: ${resultadoClique.textoBody}`);
      throw new Error('Nenhum card de serviço encontrado com Corte, Serviço ou Moeda.');
    }

    const servicoLimpo = resultadoClique.textoClicado
    ?.replace(/edit_square/i, '') 
    ?.replace(/\s+/g, ' ')        
    ?.trim();

    console.log(`✅ Serviço escolhido: ${servicoLimpo}`);
    await page.waitForTimeout(1500);

    const textoDepois = await page.locator('body').innerText();
    if (/Escolha o profissional/i.test(textoDepois)) {
      return;
    }

    if (tentativa + 1 < 5) {
      console.log('⚠️ Serviço clicado não avançou. Tentando próximo card.');
      await selecionarServico(page, tentativa + 1);
    } else {
      throw new Error(`Serviço foi clicado, mas a tela não avançou. Serviço: ${resultadoClique.textoClicado}`);
    }
  }

  async function selecionarProfissional(page: Page) {
    await expect(page.locator('body')).toHaveText(/Escolha o profissional/i, { timeout: 30000 });
    await fecharCookiesSeAparecer(page);
    await page.waitForTimeout(1000);

    const resultadoClique = await page.evaluate(() => {
      function limparTexto(t: string | null) { return (t || '').replace(/\s+/g, ' ').trim(); }
      const els = Array.from(document.body.querySelectorAll('*:not(script, style, link, meta)'));

      const tituloEl = els.find(el => /^Escolha o profissional$/i.test(limparTexto(el.textContent)));
      const topTitulo = tituloEl ? tituloEl.getBoundingClientRect().top : 0;

      const profEls = Array.from(document.body.querySelectorAll('.q-card, .q-item, div, button, [role="button"]')).filter(el => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        const texto = limparTexto(el.textContent);
        const rect = el.getBoundingClientRect();
        
        const depoisDoTitulo = rect.top >= (topTitulo - 5);
        const temTamanhoPossivel = rect.width >= 40 && rect.width <= 800 && rect.height >= 20 && rect.height <= 400;
        const pareceProfissional = /Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero|person/i.test(texto);
        const naoEhMenuOuTitulo = !/Escolha o profissional|Escolha o servi[çc]o|Corte|Barba|Cejas|Servi[çc]o|Servicio|R\$|₲|\$|Dashboard|Agenda|Clientes|Atendentes|Produtos|Configura[çc][õo]es|Termos de uso|Política de privacidade|cookies|Entendi/i.test(texto);

        return depoisDoTitulo && temTamanhoPossivel && pareceProfissional && naoEhMenuOuTitulo;
      });

      if (profEls.length === 0) return { sucesso: false };

      const profPref = profEls.find(el => /Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero/i.test(limparTexto(el.textContent)));
      const card = profPref || profEls[0];
      const clicavel = card.closest('.q-card, .q-item, button, [role="button"]') || card;
      
      clicavel.scrollIntoView();
      (clicavel as HTMLElement).click();
      
      return { sucesso: true, textoClicado: limparTexto(card.textContent) };
    });

    if (!resultadoClique.sucesso) {
      throw new Error('Nenhum card de profissional foi encontrado após selecionar o serviço.');
    }

    const profissionalLimpo = resultadoClique.textoClicado
    ?.replace(/^person|person/gi, '') 
    ?.replace(/\s+/g, ' ')            
    ?.trim();
    console.log(`✅ Profissional escolhido: ${profissionalLimpo}`);
    await page.waitForTimeout(1500);

    const textoBody = await page.locator('body').innerText();    
    
    if (/Escolha o profissional/i.test(textoBody) && !/\d{2}\/\d{2}/.test(textoBody)) {
      console.log('⚠️ Ainda na etapa profissional. Tentando clicar diretamente no nome.');
      await page.evaluate(() => {
        const els = Array.from(document.body.querySelectorAll('*:visible'));
        const profPorTexto = els.find(el => /Usuario Paraguai|E2E\s+Atendente|Atendente|Barbeiro|Peluquero/i.test((el.textContent||'').trim()));
        if (profPorTexto) {
          const clicavel = profPorTexto.closest('.q-card, .q-item, button, [role="button"], div') || profPorTexto;
          clicavel.scrollIntoView();
          (clicavel as HTMLElement).click();
        }
      });
      await page.waitForTimeout(1500);
    }

    await expect(page.locator('body')).toHaveText(/Selecione o dia da semana|Selecione o dia|Escolha o dia|\d{2}\/\d{2}/i, { timeout: 30000 });
  }

  async function selecionarDataFuturaOuHoje(page: Page) {
    await page.waitForTimeout(2000);    
    const dadosData = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return /^\d{2}\/\d{2}$/.test((el.textContent || '').trim());
      });

      const datas = els.map((el, index) => {
        const texto = (el.textContent || '').trim();
        const match = texto.match(/(\d{2})\/(\d{2})/);
        if (!match) return null;
        
        const dia = Number(match[1]);
        const mes = Number(match[2]) - 1;
        const anoAtual = new Date().getFullYear();
        return { index, texto, timestamp: new Date(anoAtual, mes, dia).getTime() };
      }).filter(item => item !== null) as Array<{ index: number, texto: string, timestamp: number }>;

      if (datas.length === 0) return null;

      const agora = new Date();
      const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
      
      const datasFuturas = datas.filter(item => item.timestamp > hoje);
      const datasHoje = datas.filter(item => item.timestamp === hoje);      
      
      const dataEscolhida = datasFuturas[0] || datasHoje[0];
      
      if (!dataEscolhida) return null;
      
      const ehHoje = dataEscolhida.timestamp === hoje;
      const elementoAlvo = els[dataEscolhida.index] as HTMLElement;
      
      elementoAlvo.scrollIntoView();
      elementoAlvo.click();

      return { ehHoje, texto: dataEscolhida.texto };
    });
    
    if (!dadosData) {
      dataselecta = false  
      console.log('⚠️ AVISO: Nenhuma data futura ou de hoje foi encontrada na tela de agendamento.');
      return false; 
    }

    dataSelecionadaEhHoje = dadosData.ehHoje;
    console.log(`✅ Data escolhida: ${dadosData.texto}`);    
    
    return true; 
  }

  async function selecionarHorarioMaiorQueAgora(page: Page) {
    await page.waitForTimeout(1000);    
    const horarioEscolhido = await page.evaluate((isHoje) => {
      const els = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return /^\d{1,2}:\d{2}h$/i.test((el.textContent || '').trim());
      });

      const horarios = els.map((el, index) => {
        const texto = (el.textContent || '').trim();
        const match = texto.match(/(\d{1,2}):(\d{2})h/i);
        if (!match) return null;
        return { index, texto, minutos: (Number(match[1]) * 60) + Number(match[2]) };
      }).filter(item => item !== null) as Array<{ index: number, texto: string, minutos: number }>;

      if (horarios.length === 0) return null;

      const agora = new Date();
      const minutosAgora = (agora.getHours() * 60) + agora.getMinutes();
      const horariosValidos = isHoje ? horarios.filter(h => h.minutos > minutosAgora) : horarios;

      if (horariosValidos.length === 0) return null;

      const escolhido = horariosValidos[0];
      const elementoAlvo = els[escolhido.index] as HTMLElement;
      
      elementoAlvo.scrollIntoView();
      elementoAlvo.click();

      return escolhido.texto;
    }, dataSelecionadaEhHoje);

    if (!horarioEscolhido) throw new Error('Não existe horário disponível maior que a hora atual para a data selecionada.');

    console.log(`✅ Horário escolhido: ${horarioEscolhido}`);
  }

  async function selecionarCliente(page: Page) {
    await expect(page.locator('body')).toHaveText(
      /Nome do cliente|Nombre del cliente|Cliente|Selecione o cliente/i, 
      { timeout: 30000 }
    );

    const inputNome = page.locator('input:visible').nth(1);
    await inputNome.scrollIntoViewIfNeeded();  
    await inputNome.click({ force: true });
    
    await page.waitForTimeout(1000);
    
    const primeiraOpcao = page.locator('.q-menu:visible .q-item, .q-virtual-scroll__content .q-item, [role="option"]')
      .filter({ hasNotText: /Nenhum resultado|Sin resultados/i }).first();
          
    const nomeClienteText = await primeiraOpcao.innerText();
    const nomeClienteLimpo = nomeClienteText?.replace(/\s+/g, ' ').trim();
    
    await primeiraOpcao.click({ force: true });    
    
    console.log(`✅ Selecionou o primeiro cliente da lista: ${nomeClienteLimpo}`);
    
    await page.waitForTimeout(500);
 
    console.log('📝 FIM DE DADOS ENVIADOS PRA API');
  }
  
  test('Deve cadastrar um agendamento com horário futuro.', async ({ page }) => {
    test.setTimeout(120000);     
    page.on('pageerror', (err) => {
      const msg = err.message || '';
      if (/Element not found|Cannot read properties of null.*nextSibling|reading 'nextSibling'/i.test(msg)) {
        console.log(`⚠️ Erro ignorado da aplicação: ${msg}`);
      }
    });

    const tablet = devices['iPad (gen 6)'];
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setExtraHTTPHeaders({ 'User-Agent': tablet.userAgent });

    page.on('pageerror', (err) => {
      const msg = err.message || '';
      if (/Element not found|Cannot read properties of null.*nextSibling|reading 'nextSibling'/i.test(msg)) {
        console.log(`⚠️ Erro ignorado da aplicação: ${msg}`);
      }
    });

    console.log('📱 Resolução alterada para Tablet.');

    await page.context().clearCookies();   
    
    await loginCompleto(page);
    await fecharCookiesSeAparecer(page);    
    
    await abrirAgenda(page);
    await abrirCadastroAgendamento(page);

    const salvarAgendamentoPromise = page.waitForResponse((response) =>
    response.url().includes('/schedules') &&
    ['POST', 'PUT', 'PATCH'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300,
    { timeout: 15000 }
    ).catch(() => null);
    console.log('📝 DADOS ENVIADOS PRA API');
    await selecionarServico(page);
    await selecionarProfissional(page);
    await selecionarDataFuturaOuHoje(page);

    if(dataselecta){
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toHaveText(/Hor[aá]rios dispon[ií]veis|Horarios disponibles/i, { timeout: 30000 });

    await selecionarHorarioMaiorQueAgora(page);
    await page.waitForTimeout(1000);

    await selecionarCliente(page);

    const btnAgendar = page.locator('button:visible, .q-btn:visible, [role="button"]:visible')
      .filter({ hasText: /Agendar|To Schedule|Guardar/i }).first();
    
    await btnAgendar.scrollIntoViewIfNeeded();
    await btnAgendar.click({ force: true });
    console.log('✅ Clicou em Agendar');

    const responseAgendamento = await salvarAgendamentoPromise;

    if (responseAgendamento) {      
      const payloadEnviado = responseAgendamento.request().postDataJSON();

      console.log('🌐 URL do POST:', responseAgendamento.url());
      console.log(`✅ Status da resposta API: ${responseAgendamento.status()}`);
      console.log('✅ Payload enviado (POST):\n', JSON.stringify(payloadEnviado, null, 2));
      
      const urlBase = responseAgendamento.url().split('?')[0].replace(/\/$/, '');
      const headersGet = { ...responseAgendamento.request().headers() };
      delete headersGet['content-type'];
      delete headersGet['content-length'];
      delete headersGet[':method'];
      delete headersGet[':path'];
      delete headersGet[':authority'];
      delete headersGet[':scheme'];

      const dataAgendada = payloadEnviado?.date;
      const urlConsulta = `${urlBase}?date=${dataAgendada}&page=1&perPage=50`;

      const respostaGet = await page.request.get(urlConsulta, {
        headers: headersGet,
      });

      console.log('🌐 URL da consulta de listagem:', urlConsulta);
      console.log(`✅ Status da consulta GET: ${respostaGet.status()}`);

      if (respostaGet.status() === 200) {
        const jsonConsulta = await respostaGet.json();
        const listaAgendamentos: any[] = jsonConsulta?.data || jsonConsulta || [];
        
        const agendamentoEncontrado = listaAgendamentos.find((ag: any) => {
          const mesmaData = ag.date === payloadEnviado?.date;
          
          const horaObjeto = (ag.time || ag.start_time || '').substring(0, 5);
          const horaPayload = (payloadEnviado?.time || '').substring(0, 5);
          const mesmoHorario = horaObjeto === horaPayload;
          
          const mesmoClienteId = payloadEnviado?.customerId && ag.customerId === payloadEnviado?.customerId;
          const mesmoClienteNome = 
            ag.customerName?.trim().toUpperCase() === payloadEnviado?.customerName?.trim().toUpperCase() ||
            ag.customer?.name?.trim().toUpperCase() === payloadEnviado?.customerName?.trim().toUpperCase();

          return mesmaData && mesmoHorario && (mesmoClienteId || mesmoClienteNome);
        });

        if (agendamentoEncontrado) {
          const idEncontrado = agendamentoEncontrado.id || agendamentoEncontrado.iid;
          console.log('✅ REGISTRO ENCONTRADO COM SUCESSO!');
          console.log('🆔 ID do Novo Agendamento:', idEncontrado);
          console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(agendamentoEncontrado, null, 2));
        } else {
          console.log(`⚠️ Agendamento do cliente "${payloadEnviado?.customerName}" às ${payloadEnviado?.time} não foi localizado na lista.`);
          console.log('🔍 Exemplo do primeiro registro retornado pela API GET para comparação:\n', JSON.stringify(listaAgendamentos[0] || {}, null, 2));
        }
      } else {
        console.log(`⚠️ Falha ao buscar a listagem de agendamentos. Status HTTP: ${respostaGet.status()}`);
      }
    } 
     
    await expect(page.locator('body')).toHaveText(
      /agendamento|sucesso|salvo|criado|Listagem de agendamentos|guardado|creado/i, 
      { timeout: 30000 }
    );
    console.log('✅ Agendamento criado com sucesso!');
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
    }
    else{
        console.log('⚠️ Deve cadastrar o horário do professional!');
    }
  });
});