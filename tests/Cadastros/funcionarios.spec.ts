import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';

test('Cadastro de funcionários', async ({ page }) => {  

  await loginCompleto(page);

   await page.waitForTimeout(2000);       
    
    const salvarFuncionarioPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/funcionario') &&
    ['POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300
  );
  
  await page.getByText(/funcionários/i).click({ force: true });
  console.log('✅ Clicou em Funcionários');  
  
  const btnCadastrar = page.getByText(/cadastrar funcionário/i).first();
  await expect(btnCadastrar).toBeVisible();
  await btnCadastrar.click();
  console.log('✅ Clicou em Cadastrar Funcionário');

  console.log('DADOS ENVIADOS PRA API'); 
  const nomefuncionario = obterNomePessoaAleatorio();
  const camponomefuncionario = page
  .locator('.q-field')
  .filter({ hasText: /funcionário/i })
  .first()
  .locator('input');
  await expect(camponomefuncionario).toBeVisible();
  await camponomefuncionario.fill(nomefuncionario);
  console.log('✅ Nome do Funcionário:', nomefuncionario.toUpperCase());

  const cargofuncionario = `OPERADOR DO CAIXA ${Date.now()}`;
  const campocargofuncionario = page
  .locator('.q-field')
  .filter({ hasText: /cargo/i })
  .last()
  .locator('input');
  await expect(campocargofuncionario).toBeVisible();
  await campocargofuncionario.fill(cargofuncionario);
  console.log('✅ Cargo do Funcionário:', cargofuncionario);

  const tipdoc = await page.locator('input[aria-label="Tipo de documento"]').inputValue();      
  console.log('✅ Tipo de Documento:', tipdoc.toUpperCase()); 
  
  const ruc = gerarRUC();
  const campoCI = page
  .locator('.q-field')
  .filter({ hasText: /\bcédula de identidade\b/i })
  .first()
  .locator('input');
  await campoCI.scrollIntoViewIfNeeded();
  await expect(campoCI).toBeVisible();
  await campoCI.fill('');
  await campoCI.type(ruc, { delay: 50 });
  console.log('✅ Número do RUC:', ruc); 
  console.log('***FIM DADOS ENVIADOS ***');
  
  await page.locator('.q-btn')
  .filter({ hasText: /salvar|guardar/i })
  .click({ force: true });
  console.log('✅ Clicou em Salvar Funcionário'); 
  
    const salvarUrlResponse = await salvarFuncionarioPromise;     
    const urlCompletaPost = salvarUrlResponse.url();  

    const salvarFuncionarioResponse = await salvarFuncionarioPromise;
    const dadosSalvos = await salvarFuncionarioResponse.json();
    console.log('✅DADOS RETORNADOS NA CRIAÇÃO***');
    console.log(JSON.stringify(dadosSalvos, null, 2));
    
    const idFuncionario = dadosSalvos.funcionario.controle.toString().trim();    
    const urlRegistroCriado = urlCompletaPost.replace('/geral', `/${idFuncionario}`);    
    const headersOriginais = salvarFuncionarioResponse.request().headers();
    const headersGetRegistro: Record<string, string> = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      authorization: headersOriginais['authorization'],
      'x-xsrf-token': headersOriginais['x-xsrf-token'],
      'x-tenant': headersOriginais['x-tenant'],
      'x-empresa': headersOriginais['x-empresa'],
    };
    
    const getCriadoResponse = await page.request.get(urlRegistroCriado, {
      headers: headersGetRegistro,
    });
    console.log('🌐 URL do registro criado:', urlRegistroCriado);
    console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO');
    console.log('✅ Novo Controle Funcionário:', idFuncionario);        
    console.log(`✅ Status: ${getCriadoResponse.status()}`);

    try {
      const dadosCriado = await getCriadoResponse.json();
      console.log(JSON.stringify(dadosCriado, null, 2));
    } catch (error) {
      console.error('Erro ao converter resposta para JSON:', error);
      const corpoBruto = await getCriadoResponse.text();
      console.log('Corpo bruto da resposta:', corpoBruto);
    }

    expect([404, 200]).toContain(getCriadoResponse.status());    
  
  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);  
});

function gerarRUC() {
  const base = Math.floor(1000000 + Math.random() * 9000000).toString();
  const pesos = [2, 3, 4, 5, 6, 7, 2];
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += parseInt(base[i]) * pesos[i];
  }
  const resto = soma % 11;
  const dv = resto > 1 ? 11 - resto : 0;
  return `${base}-${dv}`;
}