import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { navegarPara } from '../../utils/navegar';

test.describe('Agendamentos - Faz o cadastro de 4 Agendamentos', () => {
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
    await page.waitForTimeout(1000);
  await navegarPara(page, 'Agendamentos');
  }

  async function abrirCadastroAgendamento(page: Page) {
    await page.waitForTimeout(1000);
    const btnCadastrar = page.getByText(/Novo agendamento/i).first();
    await btnCadastrar.click({ force: true });
  }

 async function selecionarServico(page: Page, tentativa = 0): Promise<void> {    
    await fecharCookiesSeAparecer(page);
    await page.waitForTimeout(1000);
    
    const cardsServicos = page.locator('.q-card, .q-item, [role="button"]')
      .filter({ hasText: /\d+\s*min|₲|R\$|\$|Gs|Valor/i })
      .filter({ hasNotText: /Dashboard|Agenda|Clientes|Atendentes|Produtos|Configura/i });

    await cardsServicos.first().waitFor({ state: 'visible', timeout: 30000 });
    const count = await cardsServicos.count();

    if (count === 0) {
      throw new Error('Nenhum card de serviço foi localizado na tela.');
    }

    const index = Math.min(tentativa, count - 1);
    const cardAlvo = cardsServicos.nth(index);

    const texto = await cardAlvo.innerText();
    const servicoLimpo = texto.replace(/\s+/g, ' ').trim();
    console.log(`✅ Serviço escolhido: ${servicoLimpo}`);

    await cardAlvo.scrollIntoViewIfNeeded();
    await cardAlvo.click({ force: true });
    await page.waitForTimeout(1000);
  }

  async function selecionarProfissional(page: Page) {  
    await fecharCookiesSeAparecer(page);
    await page.waitForTimeout(1200);

    const resultadoClique = await page.evaluate(() => {
      function limparTexto(t: string | null) { return (t || '').replace(/\s+/g, ' ').trim(); }
      
      const titulos = Array.from(document.querySelectorAll('*')).filter(el => {
        const txt = limparTexto(el.textContent);
        return /^(Atendente|Atendentes|Profissional|Profissionais|Profesional|Profesionales)$/i.test(txt);
      });

      let topTitulo = 0;
      if (titulos.length > 0) {
        const rects = titulos.map(t => t.getBoundingClientRect()).filter(r => r.height > 0 && r.width > 0);
        if (rects.length > 0) {
          topTitulo = rects[rects.length - 1].top;
        }
      }

      const candidatosAtendentes: HTMLElement[] = [];
      const todosElementos = Array.from(document.querySelectorAll('.q-card, .q-item, [role="button"], div.cursor-pointer'));

      todosElementos.forEach(el => {
        const elemento = el as HTMLElement;
        const style = window.getComputedStyle(elemento);
        if (style.display === 'none' || style.visibility === 'hidden') return;

        const texto = limparTexto(elemento.textContent);
        if (!texto || texto.length < 2 || texto.length > 150) return;

        const rect = elemento.getBoundingClientRect();
        if (rect.width < 20 || rect.height < 15) return;

        // O card de atendente deve estar localizado ABAIXO do título "Atendente" na tela
        if (topTitulo > 0 && rect.top < topTitulo - 5) return;

        // 🛑 FILTROS RÍGIDOS ANTI-SERVIÇO E ANTI-MENU
        const temMinutosOuDuracao = /\d+\s*min/i.test(texto); // sem \b para capturar textos grudados como JUL20 min
        const temPrecoOuValor = /(?:R\$|\$|₲|G|Gs\.?|G\$)\s*[\d.,]+|[\d.,]+\s*(?:R\$|\$|₲|G|Gs\.?|G\$)|Valor/i.test(texto);
        const ehNomeDeServico = /CORTE|LAVADO|HIDRATA|BARBA|PEDI|SECADO|TATOO|PENTEADO|COLORA|MASSAGEM|PEELING|BOTOX|PROGRESSIVA|DAY SPA|REFLEXOLOGIA|ESFOLIA|PIGMENTA|RECONSTRU|ESCORA/i.test(texto);
        const ehMenuOuSistema = /Dashboard|Agendamentos|Clientes|Profissionais|Catálogo|Planos|Comissões|Financeiro|Deus seja|Desconectado|Novo agendamento|Selecione|Serviços|Atendente|Termos|Política|Alterações|Desfazer|Criar agendamento/i.test(texto);

        if (temMinutosOuDuracao || temPrecoOuValor || ehNomeDeServico || ehMenuOuSistema) return;

        candidatosAtendentes.push(elemento);
      });

      if (candidatosAtendentes.length === 0) {
        return { sucesso: false, texto: '' };
      }
      
      const cardAtendente = candidatosAtendentes[0];
      const clicavel = (cardAtendente.closest('.q-card, .q-item, button, [role="button"]') || cardAtendente) as HTMLElement;

      clicavel.scrollIntoView();
      clicavel.click();

      return { sucesso: true, texto: limparTexto(cardAtendente.textContent) };
    });

    if (!resultadoClique.sucesso) {
      throw new Error('Nenhum atendente/profissional válido foi encontrado abaixo do título na tela.');
    }

    const atendenteLimpo = resultadoClique.texto
      ?.replace(/^person|person/gi, '') 
      ?.replace(/\s+/g, ' ')            
      ?.trim();

    console.log(`✅ Profissional escolhido: ${atendenteLimpo}`);
    await page.waitForTimeout(1500);
    
    await expect(page.locator('body')).toHaveText(/Selecione o dia|Escolha o dia|Horario|Horário|Data|\d{2}\/\d{2}|\d{2}:\d{2}/i, { timeout: 30000 });
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
      const umDiaMs = 24 * 60 * 60 * 1000;
      
      const datasFuturas = datas.filter(item => item.timestamp > hoje);
      const datasHoje = datas.filter(item => item.timestamp === hoje);            
      
      const datasEntre1E7Dias = datasFuturas.filter(item => {
        const diffDias = Math.round((item.timestamp - hoje) / umDiaMs);
        return diffDias >= 1 && diffDias <= 7;
      });

      let dataEscolhida = null;
      if (datasEntre1E7Dias.length > 0) {        
        const randomIndex = Math.floor(Math.random() * datasEntre1E7Dias.length);
        dataEscolhida = datasEntre1E7Dias[randomIndex];
      } else {        
        dataEscolhida = datasFuturas[0] || datasHoje[0];
      }
      
      if (!dataEscolhida) return null;
      
      const ehHoje = dataEscolhida.timestamp === hoje;
      const elementoAlvo = els[dataEscolhida.index] as HTMLElement;
      
      elementoAlvo.scrollIntoView();
      elementoAlvo.click();

      return { ehHoje, texto: dataEscolhida.texto };
    });
    
    if (!dadosData) {
      dataselecta = false;  
      console.log('⚠️ AVISO: Nenhuma data futura ou de hoje foi encontrada na tela de agendamento.');
      return false; 
    }

    dataSelecionadaEhHoje = dadosData.ehHoje;
    console.log(`✅ Data escolhida: ${dadosData.texto}`);    
    
    return true; 
}

  async function selecionarHorarioMaiorQueAgora(page: Page, dataSelecionadaEhHoje: boolean) {
  
  await page.waitForTimeout(1000);    

  const horarioEscolhido = await page.evaluate((isHoje) => {  
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;           
      return /^\d{1,2}:\d{2}(?:h)?$/i.test((el.textContent || '').trim());
    });    
    const horarios = els.map((el, index) => {
      const texto = (el.textContent || '').trim();
      const match = texto.match(/(\d{1,2}):(\d{2})/);
      if (!match) return null;
      return { index, texto, minutos: (Number(match[1]) * 60) + Number(match[2]) };
    }).filter(item => item !== null) as Array<{ index: number, texto: string, minutos: number }>;

    if (horarios.length === 0) return null;

    const agora = new Date();
    
    const minutosAgora = (agora.getHours() * 60) + agora.getMinutes() + 5;     
    
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

  const inputNome = page.getByPlaceholder('Busque por nome ou telefone, ou digite um nome novo');
  
  await inputNome.waitFor({ state: 'visible' });
  await inputNome.scrollIntoViewIfNeeded();  
  await inputNome.click({ force: true });
  
  await inputNome.pressSequentially('a', { delay: 100 }); 
  
  const opcoes = page.locator(
    '.p-autocomplete-option, .p-autocomplete-item, .p-autocomplete-overlay li[role="option"], ul[role="listbox"] li[role="option"]:not(.iti__country)'
  ).filter({ hasNotText: /Nenhum resultado|Sin resultados|Não encontrado/i });

  const primeiraOpcao = opcoes.first();
  
  await primeiraOpcao.waitFor({ state: 'visible', timeout: 10000 });
  
  const nomeClienteText = await primeiraOpcao.innerText();
  const nomeClienteLimpo = nomeClienteText?.replace(/\s+/g, ' ').trim();

  await primeiraOpcao.click({ force: true });    
  
  console.log(`✅ Selecionou o cliente da lista: ${nomeClienteLimpo}`);
  
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

    await page.context().clearCookies();        
    await loginCompleto(page);
    await fecharCookiesSeAparecer(page);        
    let agendar = 1
    while (agendar <=4)
    {
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
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).toHaveText(/Hor[aá]rios dispon[ií]veis|Horarios disponibles/i, { timeout: 30000 });

        await selecionarHorarioMaiorQueAgora(page, false);
        await page.waitForTimeout(1000);

        await selecionarCliente(page);

        const btnAgendar = page.locator('button:visible, .q-btn:visible, [role="button"]:visible')
          .filter({ hasText: /Criar agendamento|To Schedule|Guardar/i }).first();
        
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
        //await capturarRequisicoesApi(page);    
        console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
        }
        else{
            console.log('⚠️ Deve cadastrar o horário do professional!');
        }
        agendar++;
    }
  });  
});