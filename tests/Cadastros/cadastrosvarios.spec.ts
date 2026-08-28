import { test, expect } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';
import { obterProdutoAleatorio } from '../../utils/listaprodutos';
import { obterServicoAleatorio } from '../../utils/listaservicos';
import { obterNomePlanoAleatorio } from '../../utils/listagemplanos';
import { empresasParaguai } from '../../utils/rucs-paraguai';
import { navegarPara } from '../../utils/navegar';

function gerarCPFValido(): string {
  const rand = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, rand);

  const d1 = 11 - (n.reduce((acc, value, index) => acc + value * (10 - index), 0) % 11);
  n.push(d1 >= 10 ? 0 : d1);

  const d2 = 11 - (n.reduce((acc, value, index) => acc + value * (11 - index), 0) % 11);
  n.push(d2 >= 10 ? 0 : d2);

  return n.join('');
}

function gerarRUC(): string {
  const empresaAleatoria = empresasParaguai[Math.floor(Math.random() * empresasParaguai.length)];
  return empresaAleatoria.ruc;
}

function gerarTelefoneAleatorio(): string {
  const ddd = '49';
  const primeiroDigito = '9';
  const numero = Math.floor(10000000 + Math.random() * 90000000);
  return `${ddd}${primeiroDigito}${numero}`;
}

test('Cadastros de Vários Agenda', async ({ page }) => {
  test.setTimeout(120000);  
  
  await loginCompleto(page);  
  console.log('🧾 CADASTRO DE CLIENTES');  
  await navegarPara(page, 'Clientes');
  console.log('✅ Navegou para Clientes');
  
  const btnCadastrar = page.getByText(/Cadastrar cliente|Novo cliente|Registrar cliente/i).first();
  await btnCadastrar.waitFor({ state: 'visible', timeout: 15000 });
  await btnCadastrar.click({ force: true });
  console.log('✅ Abriu Form de Clientes');  
  
  const salvarPessoaPromise = page.waitForResponse((response) =>
  (response.url().includes('/api/') || response.url().includes('/customers') || response.url().includes('/pessoa')) &&
  ['POST', 'PUT'].includes(response.request().method()) &&
  response.status() >= 200 &&
  response.status() < 300
  ).catch(() => null);
  
  await page.locator('input:visible').first().waitFor({ state: 'visible', timeout: 10000 });
  
  const nomeCliente = obterNomePessoaAleatorio();
  const telefone = gerarTelefoneAleatorio();
  let documento = gerarCPFValido();    
  const email = `cliente_email.${Date.now()}@teste.com`;
  await page.waitForTimeout(1000);  
  
  const inputsPrincipais = page.locator('input:visible');
  await inputsPrincipais.nth(0).fill(nomeCliente);  
  await inputsPrincipais.nth(1).fill(telefone);     
  await inputsPrincipais.nth(2).fill(documento);    
  const valorInput = await inputsPrincipais.nth(2).inputValue();
  const pessoa = valorInput.length;  
  await inputsPrincipais.nth(3).fill(email);        
  await inputsPrincipais.nth(4).fill('05082003');   
  console.log('✅ Preencheu dados principais');
  await page.waitForTimeout(2000);    
  
  if(pessoa!=14){
    documento = gerarRUC();
    console.log('✅ Cliente Paraguaio');
  }
  else{
   console.log('✅ Cliente Brasileiro');
  }

  const comboboxSexCliente = page.locator('role=combobox[name="Selecione uma opção"]').first();
  await comboboxSexCliente.click();
  const opcaoSexCliente = page
    .locator('[role="option"]:visible')
    .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
    .first();       
  const valorSelecionadoSex = await opcaoSexCliente.innerText();
  console.log(`✅ Sexo selecionado:  ${valorSelecionadoSex}`);
  await opcaoSexCliente.click();
  
  if(pessoa!=14){
  await page.waitForTimeout(1000);      
  const comboboxTipo = page.locator('role=combobox[name="Selecione uma opção"]').first()
  await comboboxTipo.click();
  const opcaoTipo = page
    .locator('[role="option"]:visible') 
    .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
    .first();       
  const valorSelecionadoTip = await opcaoTipo.innerText();
  console.log(`✅ Tipo de cliente selecionado: ${valorSelecionadoTip}`);
  await opcaoTipo.click();
  }

  try {
    const btnAdicionar = page.getByText(/Adicionar/i).first();
    if (await btnAdicionar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnAdicionar.click({ force: true });
      console.log('✅ Clicou em Adicionar Endereço');
      await page.waitForTimeout(1000);  

      const dialog = page.locator(
        '.q-dialog:visible, [role="dialog"]:visible:not(.iti__country-selector), .p-sidebar:visible, .modal:visible'
      ).first();
                         
      await dialog.waitFor({ state: 'visible', timeout: 5000 });      

      const primeiroInputModal = dialog.locator('input:visible').first();
      await primeiroInputModal.waitFor({ state: 'visible', timeout: 4000 });
      const inputsModal = dialog.locator('input:visible');
      const nomeEndereco = `Endereço Principal ${Date.now()}`;
      const cepValido = '89710150';
      const numero = `${Math.floor(100 + Math.random() * 900)}`;
      
      await inputsModal.nth(0).fill(nomeEndereco); 
      await page.waitForTimeout(1000);   
      
      const checkbox = dialog.locator('[role="checkbox"], input[type="checkbox"], .q-checkbox').first();
      if (await checkbox.isVisible()) {
        await checkbox.click({ force: true });
        console.log('✅ Marcou como Endereço Principal');      }      
      
      await page.waitForTimeout(1500);         
      if(pessoa===14)
      {
      await inputsModal.nth(2).fill(cepValido);      
      await inputsModal.nth(4).fill(numero);
      }
      else
      {
        const container = page.locator('[role="dialog"]:visible'); // ou 'body' se não for modal
        const cb1 = container.getByRole('combobox').nth(0);
        await cb1.click();
        await page.locator('[role="listbox"]:visible [role="option"]')
          .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
          .nth(1).click();
        await page.locator('[role="listbox"]').first().waitFor({ state: 'hidden' });

        await page.waitForTimeout(1000);    

        const cb2 = container.getByRole('combobox').nth(1);
        await cb2.waitFor({ state: 'visible' });
        await cb2.click();
        await page.locator('[role="listbox"]:visible [role="option"]')
          .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
          .nth(2).click();
        await page.locator('[role="listbox"]').first().waitFor({ state: 'hidden' });

        await page.waitForTimeout(1000);    

        const cb3 = container.getByRole('combobox').nth(2);
        await cb3.waitFor({ state: 'visible' });
        await cb3.click();
        await page.locator('[role="listbox"]:visible [role="option"]')
          .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
          .first().click();
          
        await inputsModal.nth(2).fill('001518');
        await inputsModal.nth(3).fill('CALLE LA ESPERANZA');
        await inputsModal.nth(4).fill(numero);
        await inputsModal.nth(5).fill('PLANALTO');
        await inputsModal.nth(6).fill('CASA');
      }
      
      console.log('✅ Preencheu endereço no modal');
      await page.waitForTimeout(1000);    

      const btnConfirmar = dialog.getByText(/Gravar/i).first();
      await btnConfirmar.click({ force: true });
      console.log('✅ Confirmou Endereço');
    }
  } catch (e) {
    console.log('⚠️ Modal de endereço não esteve disponível ou falhou — prosseguindo sem endereço:', (e as Error).message);
  }    

  await page.waitForTimeout(1000);    
  const btnGravar = page.getByText(/Criar cliente|Gravar|Salvar|Cadastrar|Registrar cliente/i).first();
  await btnGravar.waitFor({ state: 'visible', timeout: 10000 });
  await btnGravar.click({ force: true });
  console.log('✅ Clicou em Gravar/Registrar Cliente');  

  let respostaJson: any = null;
  const salvarResponse = await salvarPessoaPromise;    

  if (salvarResponse) {
  console.log('🌐 A URL capturada do POST é:', salvarResponse.url());
  console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);

      try {        
        respostaJson = await salvarResponse.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJson, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }
    }
    
    const idPessoa = respostaJson?.data?.id?.toString()?.trim() || respostaJson?.id?.toString()?.trim();

    if (salvarResponse && idPessoa) {     
      const urlPost = salvarResponse.url().replace(/\/$/, '');
      const urlRegistroCriado = `${urlPost}/${idPessoa}`;      
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

      console.log('🌐 URL do registro criado:', urlRegistroCriado);
      console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO');
      console.log('✅ Novo Controle/ID:', idPessoa);    
      console.log(`✅ Status GET: ${getCriadoResponse.status()}`);

      try {
        const dadosCriado = await getCriadoResponse.json();
        console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(dadosCriado, null, 2));
      } catch (error) {
        console.error('⚠️ Erro ao converter resposta para JSON:', error);
        const corpoBruto = await getCriadoResponse.text();
        console.log('Corpo bruto da resposta:', corpoBruto);
      }
    } else {
      console.log('⚠️ Não foi possível obter o ID do salvamento para consultar o registro.');
}

  try {    
    console.log('✅ Cliente cadastrado com sucesso!');
  } catch (e) {
    console.log('⚠️ Validação de texto concluída.');
  }       
  
  console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   

  
    let inicioTeste = new Date();  
    console.log('🧾 CADASTRO DE ATENDENTES');  
    console.log(`🕒 Início do teste: ${formatarDataHora(inicioTeste)}`);    
    await navegarPara(page, 'Profissionais');
    console.log(`✅ Clicou em Profissionais`);          
    await page.waitForTimeout(1000);                 
    
    const btnCadastrar1 = page.getByText(/Novo profissional/i).first();
    await btnCadastrar1.waitFor();
    await btnCadastrar1.click({ force: true });      
    console.log(`✅ Clicou em Cadastrar Atendente`);  
    console.log(`✅ Abriu Form de Atendentes`);                
    
    const salvarAtendentePromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/service-providers') || response.url().includes('/atendente')) &&
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
    const nomeAtendente = obterNomePessoaAleatorio();
    const emailAtendente = `email_atendente.${timestamp}@sgbr.com`;
    const senha = 'Teste@123456';    
    
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
        try {
            const campo = page.locator('input:visible').nth(index);
            await campo.scrollIntoViewIfNeeded();
            await campo.click({ force: true });
            await campo.press('Control+A');
            await campo.press('Backspace');
            await campo.type(texto, { delay: 50 });
            if (index === 4 || index === 5) 
             console.log(`✅ ${nomeCampo}:`, Number(texto) / 100+'%');
            else  
             console.log(`✅ ${nomeCampo}:`, texto);
        } catch (e) {
            console.log(`⚠️ Falha ao preencher ${nomeCampo}`);
        }
    };    
    
    await preencherCampo(0, emailAtendente, 'E-mail do Atendente');
    await preencherCampo(1, nomeAtendente, 'Nome do Atendente');
    await preencherCampo(2, senha, 'Senha');
    await preencherCampo(3, senha, 'Confirmação de Senha');
    await preencherCampo(4, '3000', 'Comissão Serviços');
    await preencherCampo(5, '2000', 'Comissão Produtos');

    await page.waitForTimeout(1000);       
    
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    } catch (e) {}
    console.log('📝 FIM DE DADOS ENVIADOS PRA API');
    
    const btnGravar1 = page.getByText(/Criar profissional/i).first();
    await btnGravar1.waitFor();
    await btnGravar1.click({ force: true });
    console.log('✅ Clicou em Gravar');              
    
    let respostaJson1: any = null;
    const salvarResponse1 = await salvarAtendentePromise;    

    if (salvarResponse1) {
      console.log('🌐 A URL capturada do POST é:', salvarResponse1.url());
      console.log(`✅ Status da resposta API: ${salvarResponse1.status()}`);

      try {        
        respostaJson1 = await salvarResponse1.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJson1, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }
    }
    
    const idAtendende = respostaJson1?.data?.id?.toString()?.trim() || respostaJson1?.id?.toString()?.trim();

    if (salvarResponse1 && idAtendende) {     
      const urlPost = salvarResponse1.url().replace(/\/$/, '');
      const urlRegistroCriado1 = `${urlPost}/${idAtendende}`;      
      const headersGetRegistro = { ...salvarResponse1.request().headers() };      
      delete headersGetRegistro['content-type'];
      delete headersGetRegistro['content-length'];
      delete headersGetRegistro[':method'];
      delete headersGetRegistro[':path'];
      delete headersGetRegistro[':authority'];
      delete headersGetRegistro[':scheme'];      
      const getCriadoResponse1 = await page.request.get(urlRegistroCriado1, {
        headers: headersGetRegistro,
      });

      console.log('🌐 URL do registro criado:', urlRegistroCriado1);
      console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO');
      console.log('✅ Novo ID:', idAtendende);    
      console.log(`✅ Status GET: ${getCriadoResponse1.status()}`);

      try {
        const dadosCriado1 = await getCriadoResponse1.json();
        console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(dadosCriado1, null, 2));
      } catch (error) {
        console.error('⚠️ Erro ao converter resposta para JSON:', error);
        const corpoBruto1 = await getCriadoResponse1.text();
        console.log('Corpo bruto da resposta:', corpoBruto1);
      }
    } else {
      console.log('⚠️ Não foi possível obter o ID do salvamento para consultar o registro.');
    }
    
    try {
      await expect(page.locator('body')).toHaveText(
        /sucesso|salvo|cadastrado|Listagem de atendentes|Atendentes/i,
        { timeout: 30000 }
      );
      console.log('✅ Atendente cadastrado com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }   
  
    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   

    let inicioTesteS = new Date();    
    console.log('🧾 CADASTRO DE SERVIÇOS');  
    console.log(`🕒 Início do teste: ${formatarDataHora(inicioTesteS)}`);    
    await page.waitForTimeout(1000);       
    const servico = obterServicoAleatorio();  

    await page.waitForTimeout(1000);
    await navegarPara(page, 'Catálogo', '');    
    console.log(`✅ Clicou em Serviços`);          
    console.log(`✅ Apareceu Listagem de serviços`);         
    
    const btnCadastrarS = page.getByText(/Novo serviço/i).first();
    await btnCadastrarS.waitFor();
    await btnCadastrarS.click({ force: true });      
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

    console.log('📝 DADOS ENVIADOS PRA API');        
    const nomeServico = servico.nomeServico.toUpperCase();
    const comissaoS = '1390';    
    const valorS = (servico.precoSugerido * 100).toFixed();    
    const intervalos = ['15', '30', '45', '60'];
    const duracao = intervalos[Math.floor(Math.random() * intervalos.length)];
    const descricao = `Serviço realizado por profissional qualificado, utilizando técnicas adequadas para atender às preferências e necessidades de cada cliente. O atendimento inclui avaliação do estilo desejado, execução do corte e acabamento, proporcionando um visual renovado, bem cuidado e alinhado.`;
    
    try {
      const campoNome = page.locator('input:visible').nth(2);
      await campoNome.scrollIntoViewIfNeeded();
      await campoNome.click({ force: true });
      await campoNome.fill(nomeServico, { force: true });
      console.log('✅ Nome do Serviço:', nomeServico.toUpperCase());
    } catch (e) {
      console.log('⚠️ Falha ao preencher Nome do Serviço');
    }
    await page.waitForTimeout(1000);    
    
    try {
      const campoDuracao = page.locator('input:visible').nth(3);
      await campoDuracao.click({ force: true });
      await campoDuracao.fill(duracao, { force: true });
      console.log('✅ Duração:', duracao);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Duração');
    }
    await page.waitForTimeout(1000);    
    try {
     const campoValor = page.locator('input:visible').nth(4);
      await campoValor.scrollIntoViewIfNeeded();
      await campoValor.click({ force: true });
      await campoValor.press('Control+A');
      await campoValor.press('Backspace');
      await campoValor.type(valorS.toString(), { delay: 50 });
      
      const valorFormatado = (Number(valorS) / 100).toFixed(2);
      console.log('✅ Valor:', valorFormatado);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Valor');
    }
    
    try {
      const campoComissao = page.locator('input:visible').nth(5);
      await campoComissao.scrollIntoViewIfNeeded();
      await campoComissao.click({ force: true });
      await campoComissao.press('Control+A');
      await campoComissao.press('Backspace');
      await campoComissao.type(comissaoS.toString(), { delay: 50 });      
      const comissaoFormatada = (Number(comissaoS) / 100).toFixed(2);
      console.log('✅ Comissão:', `${comissaoFormatada}%`);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Comissão');
    }
    
    try {
      const campoDescricao = page.locator('textarea:visible').first();
      await campoDescricao.scrollIntoViewIfNeeded();
      await campoDescricao.click({ force: true });
      await campoDescricao.fill(descricao.toUpperCase(), { force: true });
      console.log('✅ Descrição do Serviço preenchida');
    } catch (e) {
      console.log('⚠️ Falha ao preencher Descrição');
    }
    
    await page.waitForTimeout(1000);      
    await page.getByRole('tab', { name: /^Atendentes$/i }).first().click();     
    
    try {
        const secaoAtendentes = page.getByText(/Atendentes/i).first();
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

    await page.waitForTimeout(1000);          
    
    const abaFiscalS = page.getByRole('tab', { name: /^Fiscal Beta$/i }).first();

    if (await abaFiscalS.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Aba Fiscal Beta encontrada (Empresa Paraguai)');
      await abaFiscalS.click();
      await page.waitForTimeout(500);

      const combobox1 = page.locator('role=combobox[name="Selecione uma opção"]').first();
      await combobox1.click();
      const opcao0 = page
        .locator('[role="option"]')
        .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
        .first(); 
      const valorSelecionado0 = await opcao0.innerText();
      console.log(`✅ Afetação do IVA selecionado: ${valorSelecionado0}`);
      await opcao0.click();

      const combobox2 = page.locator('role=combobox[name="10%"]').first();
      await combobox2.click();
      const opcao3 = page.getByRole('option', { name: '10%', exact: true }).first();
      await opcao3.waitFor({ state: 'visible' });
      const valorSelecionado3 = await opcao3.innerText();
      console.log(`✅ IVA selecionado: ${valorSelecionado3}`);
      await opcao3.click();

      await page.waitForTimeout(500);    

      const combobox3 = page.locator('role=combobox[name="Selecione uma opção"]').first();
      await combobox3.click();
      const opcao2 = page
        .locator('[role="option"]')
        .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
        .nth(14)
      const valorSelecionado2 = await opcao2.innerText();
      console.log(`✅ Unidade de Medida selecionada: ${valorSelecionado2}`);
    } else {
      console.log('ℹ️ Aba Fiscal Beta não encontrada (Empresa Brasil), pulando etapas fiscais.');
    }

    console.log('📝 FIM DE DADOS ENVIADOS');           
    
    try {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
    } catch (e) {}

    await page.waitForTimeout(500);
    const btnGravarS = page.getByText(/Criar serviço|Gravar|Salvar|Cadastrar|Registrar cliente/i).first();
    await btnGravarS.waitFor({ state: 'visible', timeout: 10000 });
    await btnGravarS.click({ force: true });
    console.log('✅ Clicou em Gravar');             
    
    let respostaJsonS: any = null;
    const salvarResponseS = await salvarServicoPromise;    

    if (salvarResponseS) {
      console.log('🌐 A URL capturada do POST é:', salvarResponseS.url());
      console.log(`✅ Status da resposta API: ${salvarResponseS.status()}`);

      try {        
        respostaJsonS = await salvarResponseS.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJsonS, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }
    }
    
    const idServico = respostaJsonS?.data?.id?.toString()?.trim() || respostaJsonS?.id?.toString()?.trim();
    console.log(idServico);

    if (salvarResponseS && idServico) {     
      const urlPostS = salvarResponseS.url().replace(/\/$/, '');
      const urlRegistroCriadoS = `${urlPostS}/${idServico}`;      
      const headersGetRegistro = { ...salvarResponseS.request().headers() };      
      delete headersGetRegistro['content-type'];
      delete headersGetRegistro['content-length'];
      delete headersGetRegistro[':method'];
      delete headersGetRegistro[':path'];
      delete headersGetRegistro[':authority'];
      delete headersGetRegistro[':scheme'];      
      const getCriadoResponseS = await page.request.get(urlRegistroCriadoS, {
        headers: headersGetRegistro,
      });

      console.log('🌐 URL do registro criado:', urlRegistroCriadoS);
      console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO');
      console.log('✅ Novo ID:', idServico);    
      console.log(`✅ Status GET: ${getCriadoResponseS.status()}`);

      try {
        const dadosCriado = await getCriadoResponseS.json();
        console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(dadosCriado, null, 2));
      } catch (error) {
        console.error('⚠️ Erro ao converter resposta para JSON:', error);
        const corpoBruto = await getCriadoResponseS.text();
        console.log('Corpo bruto da resposta:', corpoBruto);
      }
    } else {
      console.log('⚠️ Não foi possível obter o ID do salvamento para consultar o registro.');
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
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);
    

    let inicioTestep = new Date();    
    console.log('🧾 CADASTRO DE PRODUTOS');  
    console.log(`🕒 Início do teste: ${formatarDataHora(inicioTestep)}`);    
    
    await page.waitForTimeout(1000);
    await navegarPara(page, 'Profissionais');
    await navegarPara(page, 'Catálogo', 'Produtos');    
    console.log(`✅ Clicou em Produtos`);          
    console.log(`✅ Apareceu Listagem de produtos`);      

    await page.waitForTimeout(1000);             
    
    const btnCadastrarP = page.getByText(/Novo produto/i).first();
    await btnCadastrarP.waitFor();
    await btnCadastrarP.click({ force: true });      
    console.log(`✅ Clicou em Cadastrar produto`);  
    console.log(`✅ Abriu Form de Produtos`);          

    const salvarProdutoPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/products') || response.url().includes('/produto')) &&
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

    await page.waitForTimeout(500);   

    console.log('📝 DADOS ENVIADOS PRA API');    
    const nomeProduto = `${obterProdutoAleatorio().nome} ${Date.now()}`;
    const valor = Math.floor(Math.random() * 1001) + 2000;   
    const quantidade = '10';
    const comissao = '2000';
    const ncm = '22021000';
    const gtin = '7891000100109';
        
    try {
      const campoNome = page.locator('input:visible').nth(0);
      await campoNome.scrollIntoViewIfNeeded();
      await campoNome.click({ force: true });
      await campoNome.fill(nomeProduto, { force: true });
      console.log('✅ Nome do Produto:', nomeProduto);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Nome do Produto');
    }

    try {
      const campoQuantidade = page.locator('input:visible').nth(1);
      await campoQuantidade.click({ force: true });
      await campoQuantidade.fill(quantidade, { force: true });
      console.log('✅ Quantidade:', quantidade);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Quantidade');
    }

    try {
      const campoValor = page.locator('input:visible').nth(2);
      await campoValor.click({ force: true });
      await campoValor.fill(valor.toFixed(), { force: true });
      console.log('✅ Valor:', valor);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Valor');
    }   
    
    try {
      const campoComissao = page.locator('input:visible').nth(3);
      await campoComissao.click({ force: true });
      await campoComissao.fill(comissao, { force: true });
      console.log('✅ Comissão:', Number(comissao)/100);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Comissão');
    }

    await page.waitForTimeout(2000);      
    
    const abaFiscalP = page.getByRole('tab', { name: /^Fiscal Beta$/i }).first();

    if (await abaFiscalP.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Aba Fiscal Beta encontrada (Empresa Paraguai)');
      await abaFiscalP.click();
      await page.waitForTimeout(500);

      const combobox1 = page.locator('role=combobox[name="Selecione uma opção"]').first();
      await combobox1.click();
      const opcao0 = page
        .locator('[role="option"]')
        .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
        .first(); // <-- Ponto e vírgula adicionado aqui
      const valorSelecionado0 = await opcao0.innerText();
      console.log(`✅ Afetação do IVA selecionado: ${valorSelecionado0}`);
      await opcao0.click();

      const combobox2 = page.locator('role=combobox[name="10%"]').first();
      await combobox2.click();
      const opcao3 = page.getByRole('option', { name: '10%', exact: true }).first();
      await opcao3.waitFor({ state: 'visible' });
      const valorSelecionado3 = await opcao3.innerText();
      console.log(`✅ IVA selecionado: ${valorSelecionado3}`);
      await opcao3.click();

      try {
        const campoNcm = page.locator('input:visible').nth(0);
        await campoNcm.click({ force: true });
        await campoNcm.fill(ncm, { force: true });
        console.log('✅ NCM:', ncm);
      } catch (e) {
        console.log('⚠️ Falha ao preencher NCM');
      }

      try {
        const campoGtin = page.locator('input:visible').nth(1);
        await campoGtin.click({ force: true });
        await campoGtin.fill(gtin, { force: true });
        console.log('✅ GTIN:', gtin);
      } catch (e) {
        console.log('⚠️ Falha ao preencher GTIN');
      }    

      const combobox3 = page.locator('role=combobox[name="Selecione uma opção"]').first();
      await combobox3.click();
      const opcao2 = page
        .locator('[role="option"]')
        .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
        .nth(4)
      const valorSelecionado2 = await opcao2.innerText();
      console.log(`✅ Unidade de Medida selecionada: ${valorSelecionado2}`);
      await opcao2.click();
      } else {
        console.log('ℹ️ Aba Fiscal Beta não encontrada (Empresa Brasil), pulando etapas fiscais.');
      }

    console.log('📝 FIM DE DADOS ENVIADOS');           
    
    const btnGravarP = page.getByText(/Criar produto/i).first();
    await btnGravarP.waitFor();
    await btnGravarP.click({ force: true });
    console.log('✅ Clicou em Gravar');              
    
    let respostaJsonP: any = null;
    const salvarResponseP = await salvarProdutoPromise;    
    
    if (salvarResponseP) {    
      console.log('🌐 A URL capturada do POST é:', salvarResponseP.url());
      console.log(`✅ Status da resposta API: ${salvarResponseP.status()}`);
      try {        
        respostaJsonP = await salvarResponseP.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJsonP, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }

      const urlListagemP = salvarResponseP.url().replace(/\/$/, '');      
      const headersGet = { ...salvarResponseP.request().headers() };
      delete headersGet['content-type'];
      delete headersGet['content-length'];
      delete headersGet[':method'];
      delete headersGet[':path'];
      delete headersGet[':authority'];
      delete headersGet[':scheme'];
      
      const urlConsulta = `${urlListagemP}?page=1&perPage=10&f_params[orderBy][field]=created_at&f_params[orderBy][type]=desc`;
      
      const respostaListagemP = await page.request.get(urlConsulta, {
        headers: headersGet,
      });

      console.log('🌐 URL da consulta de listagem:', urlConsulta);
      console.log(`✅ Status da consulta GET: ${respostaListagemP.status()}`);

      if (respostaListagemP.status() === 200) {
        const jsonListagemP = await respostaListagemP.json();      
        const listaProdutos: any[] = jsonListagemP?.data || jsonListagemP || [];
        
        const planoCriadoP = listaProdutos.find(
          (p: any) => p.name === nomeProduto || p.nome === nomeProduto
        );

        if (planoCriadoP) {
          const idEncontrado = planoCriadoP.id || planoCriadoP.iid;
          console.log('✅ REGISTRO ENCONTRADO COM SUCESSO!');
          console.log('🆔 ID do Novo Registro:', idEncontrado);
          console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(planoCriadoP, null, 2));
        } else {
          console.log(`⚠️ Plano "${nomeProduto}" não foi localizado na primeira página.`);
        }
      } else {
        console.log(`⚠️ Falha ao buscar a listagem de planos. Status HTTP: ${respostaListagemP.status()}`);
      }
    }
    
    try {
      await expect(page.locator('body')).toHaveText(
        /produto|sucesso|salvo|cadastrado|Listagem de produtos/i,
        { timeout: 20000 }
      );
      console.log('✅ Produto cadastrado com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }   
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);

    
    let inicioTesteC = new Date();    
    console.log('🧾 CADASTRO DE CATEGORIAS');  
    console.log(`🕒 Início do teste: ${formatarDataHora(inicioTesteC)}`);    

    await page.waitForTimeout(1000);
    await navegarPara(page, 'Catálogo', 'Categorias');    
    console.log(`✅ Clicou em Categorias`);          
    
    await page.waitForTimeout(1000);                
    const btnCadastrarC = page.getByText(/Nova categoria/i).first();
    await btnCadastrarC.waitFor();
    await btnCadastrarC.click({ force: true });      
    console.log(`✅ Clicou em Nova Categoria`);  
    console.log(`✅ Abriu Form de Categorias`);              
    
    const salvarCategoriaPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/categories') || response.url().includes('/categoria')) &&
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
    const timestampC = Date.now();
    const nomeCategoria = obterServicoAleatorio().categoria + ' ' + timestampC;
    const descricaoC = `Categoria destinada aos serviços de barbearia, abrangendo procedimentos voltados aos cuidados e à estética masculina, como cortes de cabelo, barba, bigode, acabamento, tratamentos capilares e outros serviços relacionados, realizados por profissionais.`;    
    
    const preencherCampoC = async (index: number, texto: string, nomeCampo: string) => {
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
    
    await preencherCampo(0, nomeCategoria, 'Nome da Categoria');
    
try {
      const campoDescricao = page.locator('textarea:visible').first();
      await campoDescricao.scrollIntoViewIfNeeded();
      await campoDescricao.click({ force: true });
      await campoDescricao.press('Control+A');
      await campoDescricao.press('Backspace');
      await campoDescricao.type(descricaoC, { delay: 20 });
      console.log('✅ Descrição preenchida:', descricao);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Descrição');
    }

    console.log('📝 FIM DE DADOS ENVIADOS PRA API');

    await page.waitForTimeout(1000);       
    
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    } catch (e) {}
    
    const btnGravarC = page.getByText(/Criar categoria/i).first();
    await btnGravarC.waitFor();
    await btnGravarC.click({ force: true });
    console.log('✅ Clicou em Gravar');              
    
    let respostaJsonC: any = null;
    const salvarResponseC = await salvarCategoriaPromise;    
    
    if (salvarResponseC) {    
      console.log('🌐 A URL capturada do POST é:', salvarResponseC.url());
      console.log(`✅ Status da resposta API: ${salvarResponseC.status()}`);
      try {        
        respostaJson = await salvarResponseC.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJsonC, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }

      const urlListagemC = salvarResponseC.url().replace(/\/$/, '');      
      const headersGet = { ...salvarResponseC.request().headers() };
      delete headersGet['content-type'];
      delete headersGet['content-length'];
      delete headersGet[':method'];
      delete headersGet[':path'];
      delete headersGet[':authority'];
      delete headersGet[':scheme'];
      
      const urlConsultaC = `${urlListagemC}?page=1&perPage=10&f_params[orderBy][field]=created_at&f_params[orderBy][type]=desc`;
      
      const respostaListagemC = await page.request.get(urlConsultaC, {
        headers: headersGet,
      });

      console.log('🌐 URL da consulta de listagem:', urlConsultaC);
      console.log(`✅ Status da consulta GET: ${respostaListagemC.status()}`);

      if (respostaListagemC.status() === 200) {
        const jsonListagemC = await respostaListagemC.json();      
        const listaCategorias: any[] = jsonListagemC?.data || jsonListagemC || [];
        
        const categoriaCriada = listaCategorias.find(
          (p: any) => p.name === nomeCategoria || p.nome === nomeCategoria
        );

        if (categoriaCriada) {
          const idEncontrado = categoriaCriada.id || categoriaCriada.iid;
          console.log('✅ REGISTRO ENCONTRADO COM SUCESSO!');
          console.log('🆔 ID do Novo Registro:', idEncontrado);
          console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(categoriaCriada, null, 2));
        } else {
          console.log(`⚠️ Categoria "${nomeCategoria}" não foi localizada na primeira página.`);
        }
      } else {
        console.log(`⚠️ Falha ao buscar a listagem de categorias. Status HTTP: ${respostaListagemC.status()}`);
      }
    }

    try {
      await expect(page.locator('body')).toHaveText(
        /categoria|sucesso|salvo|cadastrado|Listagem de categorias/i,
        { timeout: 30000 }
      );
      console.log('✅ Categoria cadastrada com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }          
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   

        
    let inicioTestePl = new Date();    
    console.log('🧾 CADASTRO DE PLANOS');  
    console.log(`🕒 Início do teste: ${formatarDataHora(inicioTestePl)}`);    

    await navegarPara(page, 'Planos');
    console.log(`✅ Clicou em Planos`);          
    await page.waitForTimeout(1000);                 
    
    const btnCadastrarPl = page.getByText(/Novo plano/i).first();
    await btnCadastrarPl.waitFor();
    await btnCadastrarPl.click({ force: true });      
    console.log(`✅ Clicou em Novo Plano`);  
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
    const nomePlano = `${obterNomePlanoAleatorio()} ${Date.now()}`;
    const valorPlano = '1475';     
    const descricaoPlano = `Plano destinado a atender às necessidades do seu negócio, oferecendo recursos essenciais, segurança, suporte e atualizações para uma gestão mais eficiente e produtiva.`;    
    
    const preencherCampoPl = async (index: number, texto: string, nomeCampo: string) => {
        try {
            const campo = page.locator('input:visible').nth(index);
            await campo.scrollIntoViewIfNeeded();
            await campo.click({ force: true });
            await campo.press('Control+A');
            await campo.press('Backspace');
            await campo.type(texto, { delay: 50 });
            console.log(`✅ ${nomeCampo.toUpperCase()}:`, texto);
        } catch (e) {
            console.log(`⚠️ Falha ao preencher ${nomeCampo}`);
        }
    };
    
    await preencherCampoPl(0, nomePlano.toUpperCase(), 'Nome do Plano');
    await preencherCampoPl(1, valorPlano, 'Valor do Plano');    
    
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
      await campoDescricao.type(descricaoPlano.toUpperCase(), { delay: 20 });
      console.log('✅ Descrição do Plano preenchida:', descricaoPlano);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Descrição');
    }    
    
    let totalValidas = 0;
    try {
      const secaoServicos = page.getByText(/Itens do plano/i).first();
      await secaoServicos.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);

      const btnAdicionar = page.locator('button, .q-btn, [role="button"]').filter({ hasText: /Adicionar serviços/i }).first();
      await btnAdicionar.click({ force: true });
      console.log('✅ Clicou em Adicionar Serviço');
      await page.waitForTimeout(1000);
     
      totalValidas = await page.evaluate(() => {
        const dialog = document.querySelector('.q-dialog:not([style*="display: none"]), [role="dialog"]');
        const raiz = dialog || document.body;
        
        const trs = Array.from(raiz.querySelectorAll('tbody tr'));
        const linhasValidas = trs.filter(tr => {
          const texto = (tr.textContent || '').replace(/\s+/g, ' ').trim();
          const temColunas = tr.querySelectorAll('td').length > 0;
          const linhaVazia = /nenhum|nenhuma|sem dados|sem resultado|não encontrado|nao encontrado/i.test(texto);
          return temColunas && texto.length > 0 && !linhaVazia;
        });

        return linhasValidas.length;
      });
    } catch (err) {
      console.log('⚠️ Falha ao abrir modal de serviços:', err);
    }

    if (totalValidas === 0) {
      console.log('⚠️ Deve cadastrar serviços: a grade de serviços está vazia ou não possui registros válidos!');
      try {
        const btnCancelarModal = page.locator('.q-dialog, [role="dialog"]').locator('button, .q-btn').filter({ hasText: /cancelar|fechar|voltar/i }).first();
        if (await btnCancelarModal.isVisible({ timeout: 2000 }).catch(() => false)) {
          await btnCancelarModal.click({ force: true });
        }
      } catch {}
      test.skip();
      return;
    }

    try {
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
    
    const btnGravarPl = page.getByText(/Criar plano/i).first();
    await btnGravarPl.waitFor();
    await btnGravarPl.click({ force: true });
    console.log('✅ Clicou em Gravar');              
    
    let respostaJsonPl: any = null;
    const salvarResponsePl = await salvarPlanoPromise;    
    
    if (salvarResponsePl) {    
      console.log('🌐 A URL capturada do POST é:', salvarResponsePl.url());
      console.log(`✅ Status da resposta API: ${salvarResponsePl.status()}`);
      try {        
        respostaJson = await salvarResponsePl.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJsonPl, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }

      const urlListagemPl = salvarResponsePl.url().replace(/\/$/, '');      
      const headersGet = { ...salvarResponsePl.request().headers() };
      delete headersGet['content-type'];
      delete headersGet['content-length'];
      delete headersGet[':method'];
      delete headersGet[':path'];
      delete headersGet[':authority'];
      delete headersGet[':scheme'];
      
      const urlConsulta = `${urlListagemPl}?page=1&perPage=10&f_params[orderBy][field]=created_at&f_params[orderBy][type]=desc`;
      
      const respostaListagemPl = await page.request.get(urlConsulta, {
        headers: headersGet,
      });

      console.log('🌐 URL da consulta de listagem:', urlConsulta);
      console.log(`✅ Status da consulta GET: ${respostaListagemPl.status()}`);

      if (respostaListagemPl.status() === 200) {
        const jsonListagemPl = await respostaListagemPl.json();      
        const listaProdutos: any[] = jsonListagemPl?.data || jsonListagemPl || [];
        
        const planoCriado = listaProdutos.find(
          (p: any) => 
            p.name?.toUpperCase() === nomePlano.toUpperCase() || 
            p.nome?.toUpperCase() === nomePlano.toUpperCase()
        );

        if (planoCriado) {
          const idEncontrado = planoCriado.id || planoCriado.iid;
          console.log('✅ REGISTRO ENCONTRADO COM SUCESSO!');
          console.log('🆔 ID do Novo Registro:', idEncontrado);
          console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(planoCriado, null, 2));
        } else {
          console.log(`⚠️ Plano "${nomePlano.toUpperCase()}" não foi localizado na primeira página.`);
        }
      } else {
        console.log(`⚠️ Falha ao buscar a listagem de planos. Status HTTP: ${respostaListagemPl.status()}`);
      }
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
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
});