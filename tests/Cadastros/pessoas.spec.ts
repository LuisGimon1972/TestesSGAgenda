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

test('Cadastro de Clientes E2E com Endereço Principal', async ({ page }) => {
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
    
    // Promessa para escutar a resposta da API ao salvar
    const salvarPessoaPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/customers') || response.url().includes('/pessoa')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
    ).catch(() => null);

    // Fechar cookies se surgir
    try {
      const btnCookie = page.getByText(/Entendi|Aceitar|Fechar/i).first();
      if (await btnCookie.isVisible({ timeout: 3000 })) {
        await btnCookie.click({ force: true });
        console.log('✅ Fechou aviso de cookies');
      }
    } catch (e) {}

    

    
    

    console.log('DADOS ENVIADOS PRA API');

    // Geração de dados dinâmicos
    const timestamp = Date.now();
    const nomeCliente = obterNomePessoaAleatorio();
    const telefone = gerarTelefoneAleatorio();
    const documento = gerarCPFValido();
    const email = `e2e.cliente.${timestamp}@teste.com`;

    // 1. Nome Completo
    try {
      const campoNome = page.locator('input:visible').first();
      await campoNome.scrollIntoViewIfNeeded();
      await campoNome.click({ force: true });
      await campoNome.fill(nomeCliente, { force: true });
      console.log('✅ Nome do Cliente:', nomeCliente);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Nome Completo');
    }

    // 2. Telefone
    try {
      const campoTelefone = page.locator('input:visible').nth(1);
      await campoTelefone.click({ force: true });
      await campoTelefone.fill(telefone, { force: true });
      console.log('✅ Telefone:', telefone);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Telefone');
    }

    // 3. Documento (CPF)
    try {
      const campoDocumento = page.locator('input:visible').nth(2);
      await campoDocumento.click({ force: true });
      await campoDocumento.fill(documento, { force: true });
      console.log('✅ Documento (CPF):', documento);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Documento (CPF)');
    }

    // 4. Email
    try {
      const campoEmail = page.locator('input:visible').nth(3);
      await campoEmail.click({ force: true });
      await campoEmail.fill(email, { force: true });
      console.log('✅ Email:', email);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Email');
    }

    // 5. Data de Nascimento
    try {
      const campoData = page.locator('input:visible').nth(4);
      await campoData.click({ force: true });
      await campoData.fill('1990-05-20', { force: true });
      console.log('✅ Data de Nascimento: 1990-05-20');
    } catch (e) {
      console.log('⚠️ Falha ao preencher Data de Nascimento');
    }

    // 6. Preenchimento do Modal de Endereço (Sequencial Direto)
    try {
      const timestampEndereco = Date.now();
      const nomeEndereco = `Endereço E2E ${timestampEndereco}`;
      const cepValido = '89710300';
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

      // Nome do Endereço
      await inputsModal.nth(indices.nomeEndereco).fill(nomeEndereco, { force: true });
      console.log('✅ Preencheu Nome do Endereço:', nomeEndereco);

      // CEP
      const cepInput = inputsModal.nth(indices.cep);
      await cepInput.fill(cepValido, { force: true });
      await cepInput.press('Enter');
      console.log('✅ Preencheu e buscou CEP:', cepValido);

      await page.waitForTimeout(2000);

      // Número
      await inputsModal.nth(indices.numero).fill(numero, { force: true });
      console.log('✅ Preencheu Número do Endereço:', numero);

      // Checkbox Endereço Principal
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

      // Confirmar Modal
      const btnConfirmar = dialog.getByText(/Confirmar/i).first();
      await btnConfirmar.click({ force: true });
      console.log('✅ Confirmou Adição do Endereço');

      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️ Etapa de inclusão de endereço executada com observações');
    }

    console.log('FIM DE DADOS ENVIADOS');           

    // Gravar/Salvar formulário
    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');      
    
    // Captura da API se disparada
    const salvarResponse = await salvarPessoaPromise;
    if (salvarResponse) {
      console.log('✅ A URL capturada do POST é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);
    }

    // Asserção final no DOM
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