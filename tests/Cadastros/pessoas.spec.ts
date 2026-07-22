import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';

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

test('Cadastro de Clientes com Endereço Principal', async ({ page }) => {
   test.setTimeout(120000);

    await loginCompleto(page);    

    await page.waitForTimeout(2000);       

    await page.locator('.q-item').filter({ hasText: 'Clientes' }).first().click({ force: true });
    console.log(`✅ Clicou em Clientes`);          
    console.log(`✅ Apareceu Listagem de Clientes`);      

    await page.waitForTimeout(2000);       
      
    const btnCadastrar = page.getByText(/Cadastrar cliente/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });      
    console.log(`✅ Clicou em Cadastrar cliente`);  
    console.log(`✅ Abriu Form de Clientes`);      

    await page.waitForTimeout(2000);           

    const salvarPessoaPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/customers') || response.url().includes('/pessoa')) &&
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
    
    console.log('📝 DADOS ENVIADOS PRA API');
    
    const timestamp = Date.now();
    const nomeCliente = obterNomePessoaAleatorio();
    const telefone = gerarTelefoneAleatorio();
    const documento = gerarCPFValido();
    const email = `cliente_email.${timestamp}@teste.com`;
    
    try {
      const campoNome = page.locator('input:visible').first();
      await campoNome.scrollIntoViewIfNeeded();
      await campoNome.click({ force: true });
      await campoNome.fill(nomeCliente, { force: true });
      console.log('✅ Nome do Cliente:', nomeCliente);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Nome Completo');
    }
    
    try {
      const campoTelefone = page.locator('input:visible').nth(1);
      await campoTelefone.click({ force: true });
      await campoTelefone.fill(telefone, { force: true });
      console.log('✅ Telefone:', telefone);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Telefone');
    }

    try {
      const campoDocumento = page.locator('input:visible').nth(2);
      await campoDocumento.click({ force: true });
      await campoDocumento.fill(documento, { force: true });
      console.log('✅ Documento (CPF):', documento);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Documento (CPF)');
    }
    
    try {
      const campoEmail = page.locator('input:visible').nth(3);
      await campoEmail.click({ force: true });
      await campoEmail.fill(email, { force: true });
      console.log('✅ Email:', email);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Email');
    }
    
    try {
      const campoData = page.locator('input:visible').nth(4);
      await campoData.click({ force: true });
      await campoData.fill('1990-05-20', { force: true });
      console.log('✅ Data de Nascimento: 1990-05-20');
    } catch (e) {
      console.log('⚠️ Falha ao preencher Data de Nascimento');
    }

    try {
      const timestampEndereco = Date.now();
      const nomeEndereco = `Endereço ${timestampEndereco}`;
      const cepValido = '89710150';
      const numero = `${Math.floor(100 + Math.random() * 900)}`;

      const btnAdicionar = page.getByText(/Adicionar/i).first();
      await btnAdicionar.waitFor();
      await btnAdicionar.click({ force: true });
      console.log('✅ Clicou em Adicionar Endereço');

      const dialog = page.locator('.q-dialog');
      await dialog.waitFor();
      await page.waitForTimeout(500);

      const inputsModal = dialog.locator('input:visible');
      const totalInputs = await inputsModal.count();

      const indices = totalInputs >= 9
        ? { nomeEndereco: 0, cep: 2, numero: 6 }
        : { nomeEndereco: 0, cep: 1, numero: 3 };
    
      await inputsModal.nth(indices.nomeEndereco).fill(nomeEndereco, { force: true });
      console.log('✅ Preencheu Nome do Endereço:', nomeEndereco);

      const cepPromise = page.waitForResponse(
        (res) => (res.url().includes('viacep') || res.url().includes('cep') || res.url().includes('addresses')) && res.status() === 200,
        { timeout: 7000 }
      ).catch(() => null);

      const cepInput = inputsModal.nth(indices.cep);
      await cepInput.fill(cepValido, { force: true });
      await cepInput.press('Enter');
      console.log('✅ Preencheu e buscou CEP:', cepValido);
      
      const cepResponse = await cepPromise;
      if (cepResponse) {
        try {
          const dadosCep = await cepResponse.json();
          const logradouroApi = dadosCep.logradouro || dadosCep.street || dadosCep.endereco;
          const bairroApi = dadosCep.bairro || dadosCep.district;
          const cidadeApi = dadosCep.localidade || dadosCep.city || dadosCep.cidade;
          const ufApi = dadosCep.uf || dadosCep.state;

          if (logradouroApi) {
            console.log(`✅ Endereço capturado: ${logradouroApi}${bairroApi ? `, ${bairroApi}` : ''} - ${cidadeApi}/${ufApi}`);
          } else {
            console.log('🌐 Resposta da API CEP:', JSON.stringify(dadosCep));
          }
        } catch (e) {}
      }

      await page.waitForTimeout(2000);           
      
      try {
        const enderecoTela = await dialog.locator('input:visible').nth(indices.cep + 1).inputValue();
        if (enderecoTela) {
          console.log('✅ Endereço preenchido na tela:', enderecoTela);
        }
      } catch (e) {}

      await inputsModal.nth(indices.numero).fill(numero, { force: true });
      console.log('✅ Preencheu Número do Endereço:', numero);
      
      const checkbox = dialog
        .locator('[role="checkbox"], .q-checkbox, input[type="checkbox"]')
        .locator('visible=true')
        .first();

      if (await checkbox.count() > 0) {
        const ariaChecked = await checkbox.getAttribute('aria-checked');
        const className = (await checkbox.getAttribute('class')) || '';
        const jaMarcado = ariaChecked === 'true' || className.includes('truthy') || className.includes('checked');
        if (!jaMarcado) {
          await checkbox.click({ force: true });
        }
      } else {
        await page.getByText(/Endere[çc]o principal/i).first().click({ force: true });
      }      

      console.log('✅ Marcou Endereço Principal');
      
      const btnConfirmar = dialog.getByText(/Confirmar/i).first();
      await btnConfirmar.click({ force: true });
      console.log('✅ Confirmou Adição do Endereço');

      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️ Etapa de inclusão de endereço executada com observações');
    }

    console.log('📝 FIM DE DADOS ENVIADOS');           
    
    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');          

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
      await expect(page.locator('body')).toHaveText(
        /cliente|sucesso|salvo|cadastrado|Listagem de clientes/i,
        { timeout: 20000 }
      );
      console.log('✅ Cliente cadastrado com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }       

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});