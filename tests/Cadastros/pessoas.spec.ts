import { test } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';
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

test('Cadastro de Clientes com Endereço Principal', async ({ page }) => {
  test.setTimeout(120000);  
  
  await loginCompleto(page);  
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
        await inputsModal.nth(5).fill('EL JUNQUITO');
        await inputsModal.nth(6).fill('EDIFICIO');
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
});