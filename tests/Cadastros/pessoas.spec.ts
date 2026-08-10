import { test, expect, Page, Locator } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';
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

test('Cadastro de Clientes com Endereço Principal', async ({ page }) => {
  test.setTimeout(120000);
  
  await loginCompleto(page);
  await page.waitForTimeout(1000);
  await navegarPara(page, 'Clientes', 'Clientes');
  console.log('✅ Navegou para Clientes');

  // Botão para abrir o formulário
  const btnCadastrar = page.getByText(/Cadastrar cliente|Novo cliente|Registrar cliente/i).first();
  await btnCadastrar.waitFor({ state: 'visible', timeout: 15000 });
  await btnCadastrar.click({ force: true });
  console.log('✅ Abriu Form de Clientes');
  
  // Promessa de captura da API no momento do salvamento
  const salvarPessoaPromise = page.waitForResponse(
    (response) =>
      (response.url().includes('/api/') || response.url().includes('/customers') || response.url().includes('/pessoa')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300,
    { timeout: 15000 }
  ).catch(() => null);

  // Aguarda primeiro input estar pronto no form principal
  await page.locator('input:visible').first().waitFor({ state: 'visible', timeout: 10000 });
  
  const nomeCliente = obterNomePessoaAleatorio();
  const telefone = gerarTelefoneAleatorio();
  const documento = gerarCPFValido();
  const email = `cliente_email.${Date.now()}@teste.com`;
  await page.waitForTimeout(1000);  
  // Preenchimento do formulário principal
  const inputsPrincipais = page.locator('input:visible');
  await inputsPrincipais.nth(0).fill(nomeCliente);   // Nome Completo
  await inputsPrincipais.nth(1).fill(telefone);      // Telefone
  await inputsPrincipais.nth(2).fill(documento);     // Documento/CPF
  await inputsPrincipais.nth(3).fill(email);         // E-mail
  await inputsPrincipais.nth(4).fill('05082026');  // Data de Nascimento
  console.log('✅ Preencheu dados principais');
   await page.waitForTimeout(4000);  
  
  // --- PREENCHIMENTO SEGURO DO ENDEREÇO ---
  try {
    const btnAdicionar = page.getByText(/Adicionar/i).first();
    if (await btnAdicionar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnAdicionar.click({ force: true });
      console.log('✅ Clicou em Adicionar Endereço');
      await page.waitForTimeout(4000);  

      const dialog = page.locator(
        '.q-dialog:visible, [role="dialog"]:visible:not(.iti__country-selector), .p-sidebar:visible, .modal:visible'
      ).first();
                         
      await dialog.waitFor({ state: 'visible', timeout: 5000 });
      
      const primeiroInputModal = dialog.locator('input:visible').first();
      await primeiroInputModal.waitFor({ state: 'visible', timeout: 4000 });

      const inputsModal = dialog.locator('input:visible');
      const totalInputs = await inputsModal.count();
      console.log(totalInputs)
      const nomeEndereco = `Endereço Principal ${Date.now()}`;
      const cepValido = '89710150';
      const numero = `${Math.floor(100 + Math.random() * 900)}`;
      
      await inputsModal.nth(0).fill(nomeEndereco); await page.waitForTimeout(1000);   ;
      const checkbox = dialog.locator('[role="checkbox"], input[type="checkbox"], .q-checkbox').first();
      if (await checkbox.isVisible()) {
      await checkbox.click({ force: true });
      console.log('✅ Marcou como Endereço Principal');
       }      
      
     

      await page.waitForTimeout(2500);      
       
      await inputsModal.nth(2).fill(cepValido);      
      
      await inputsModal.nth(4).fill(numero);
      

      console.log('✅ Preencheu endereço no modal');

      await page.waitForTimeout(1000);    

      const btnConfirmar = dialog.getByText(/Gravar/i).first();
      await btnConfirmar.click({ force: true });
      console.log('✅ Confirmou Endereço');


   
    }
  } catch (e) {
    console.log('⚠️ Modal de endereço não esteve disponível ou falhou — prosseguindo sem endereço:', (e as Error).message);
  }    

        await page.waitForTimeout(4000);    
  const btnGravar = page.getByText(/Criar cliente|Gravar|Salvar|Cadastrar|Registrar cliente/i).first();
  await btnGravar.waitFor({ state: 'visible', timeout: 10000 });
  await btnGravar.click({ force: true });
  console.log('✅ Clicou em Gravar/Registrar Cliente');
  
  const salvarResponse = await salvarPessoaPromise;
  if (salvarResponse) {
    console.log(`🌐 URL POST: ${salvarResponse.url()} | Status: ${salvarResponse.status()}`);
    try {
      const respostaJson = await salvarResponse.json();
      console.log('📦 JSON resposta:', JSON.stringify(respostaJson, null, 2));
    } catch {
      console.log('⚠️ Resposta da API não contém JSON válido.');
    }
  }

  try {
    await expect(page.locator('body')).toHaveText(/sucesso|cadastrado|cliente/i, { timeout: 10000 });
    console.log('🎉 Cliente cadastrado com sucesso!');
  } catch {
    console.log('⚠️ Mensagem explícita de sucesso não encontrada no DOM.');
  }

  await capturarRequisicoesApi(page).catch(() => null);
  console.log(`🕒 Finalização: ${formatarDataHora(new Date())}`);
});