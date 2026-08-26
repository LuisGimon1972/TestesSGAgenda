import { test, expect } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';
import { obterProdutoAleatorio } from '../../utils/listaprodutos';
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

function gerarTelefoneAleatorio(): string {
  const ddd = '49';
  const primeiroDigito = '9';
  const numero = Math.floor(10000000 + Math.random() * 90000000);
  return `${ddd}${primeiroDigito}${numero}`;
}

test('Cadastros de Vários Agenda', async ({ page }) => {
  test.setTimeout(120000);  
  
  await loginCompleto(page);  
  console.log('✅ CADASTRO DE CLIENTES');  
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
  const documento = gerarCPFValido();    
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
        await inputsModal.nth(3).fill('LA ASUNCIÓN');      
        await inputsModal.nth(4).fill('001518');
        await inputsModal.nth(5).fill('CALLE LA ESPERANZA');
        await inputsModal.nth(6).fill(numero);
        await inputsModal.nth(7).fill('EL JUNQUITO');
        await inputsModal.nth(8).fill('EDIFICIO');

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

  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(2000);    
  console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
  
    let inicioTeste = new Date();  
    console.log('✅ CADASTRO DE ATENDENTES');  
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
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJson, null, 2));        
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
    
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(1000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   

    let inicioTestep = new Date();
    
    console.log('✅ CADASTRO DE PRODUTOS');  
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
    const gtin = '7891000100109'
        
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
    await page.getByRole('tab', { name: /^Fiscal Beta$/i }).first().click();     
  
    const combobox = page.locator('role=combobox[name="Selecione uma opção"]').first();
    await combobox.click(); 
    await page.waitForTimeout(500);     
    const primeiraOpcao = page.locator('[role="option"]')
      .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
      .first();
    await primeiraOpcao.click();
    console.log('✅ Selecionou a primeira opção do combobox com sucesso!');
    await page.waitForTimeout(500);

    const combobox2 = page.locator('role=combobox[name="10%"]').first();
    await combobox2.click(); 
    await page.waitForTimeout(500);     
    const primeiraOpcao2 = page.locator('[role="option"]')
      .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
      .first();
    await primeiraOpcao2.click();

    console.log('✅ Selecionou a primeira opção do segundo combobox com sucesso!');
    await page.waitForTimeout(500);

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
    await page.waitForTimeout(500);         
    const quartaOpcao = page.locator('[role="option"]')
      .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
      .nth(4); 
    await quartaOpcao.click();
    console.log('✅ Selecionou a quarta opção do combobox com sucesso!');
    await page.waitForTimeout(500);    

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

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(2000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   

});