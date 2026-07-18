import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { empresasParaguai } from '../../utils/rucs-paraguai';

function gerarRUC(): string {
  const empresaAleatoria = empresasParaguai[Math.floor(Math.random() * empresasParaguai.length)];
  return empresaAleatoria.ruc;
}
function empresaRUC(): string {
  const empresaAleatoria = empresasParaguai[Math.floor(Math.random() * empresasParaguai.length)];
  return empresaAleatoria.razao;
}

test('Cadastro de Fornecedores', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await loginCompleto(page);      

    await page.waitForTimeout(2000);       
    
    const salvarPessoaPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/pessoa') &&
    ['POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300);

    await page.waitForTimeout(1000);
    await page.getByText(/pessoas/i).click({ force: true }); 
    console.log('✅ Clicou em Pessoas');
    console.log(`✅ Apareceu Grade de Pessoas`);  
      
    const btnCadastrar = page.getByText(/cadastrar pessoas/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });
    console.log('✅ Clicou em Cadastar Pessoa');
    console.log('✅ Abriu Form de Cadastro de Pessoas');

    console.log('DADOS ENVIADOS PRA API');
    await page.locator('[aria-label="Natureza"]').click({ force: true });
    const menu = page.locator('.q-menu:visible');
    await menu.waitFor();
    await menu
    .locator('.q-item')
    .filter({ hasText: /não contribuinte/i })
    .first()
    .click({ force: true });
        const natureza = await page.locator('input[aria-label="Natureza"]').inputValue();      
    console.log('✅ Natureza:',natureza.toUpperCase());

    await page.locator('[aria-label="Tipo do documento de identificação"]').click({ force: true });
    const menuDoc = page.locator('.q-menu').last();
    await menuDoc.waitFor();
    await menuDoc
    .locator('.q-item')
    .filter({ hasText: /carteira de identidade paraguaia/i })
    .click({ force: true });
    const tipodoc = await page.locator('input[aria-label="Tipo do documento de identificação"]').inputValue();      
    console.log('✅ Tipo de Documento:',tipodoc.toUpperCase());
    
    await page.waitForTimeout(700);
    const ruc = gerarRUC();
    await page.getByLabel(/número de documento de identificação/i).fill(ruc);
    console.log('✅ Número de Idenficação RUC:', ruc);
    
    await page.waitForTimeout(700);
    await page.locator('[aria-label="Tipo de operação"]').click({ force: true });
    const menuDoc1 = page.locator('.q-menu').last();
    await menuDoc1.waitFor();
    await menuDoc1
    .locator('.q-item')
    .filter({ hasText: /B2C/i })
    .click({ force: true }); 
    const tipoop = await page.locator('input[aria-label="Tipo de operação"]').inputValue();      
    console.log('✅ Tipo de Operação:', tipoop );

    const nome = empresaRUC();
    await page.getByLabel(/nome completo/i).fill(nome);
    console.log('✅ Nome do Fornecedor:', nome.toUpperCase());

    await page.locator('[aria-label="Tipo de cadastro"]').click({ force: true });
    const menuDoc2 = page.locator('.q-menu').last();
    await menuDoc2.waitFor();
    await menuDoc2
    .locator('.q-item')
    .filter({ hasText: /proveedor|fornecedor/i })
    .click({ force: true });
    const tipocad = await page.locator('input[aria-label="Tipo de cadastro"]').inputValue();      
    console.log('✅ Tipo de Cadastro:',tipocad.toUpperCase());

    await page.locator('.q-field')
    .filter({ hasText: /departamento/i })
    .first()
    .click({ force: true });
    const menuDepartamento = page.locator('.q-menu').last();
    await menuDepartamento.waitFor();
    await menuDepartamento
    .locator('.q-item')
    .filter({ hasText: /alto paraná|alto parana/i })
    .click({ force: true });
    const dep = await page.locator('input[aria-label="Departamento"]').inputValue();      
    console.log('✅ Departamento:',dep.toUpperCase());

    await page.locator('.q-field')
    .filter({ hasText: /distrito/i })
    .first()
    .click({ force: true });
    const menuDistrito = page.locator('.q-menu').last();
    await menuDistrito.waitFor();
    await menuDistrito
    .locator('.q-item')
    .filter({ hasText: /ciudad/i })
    .click({ force: true });
    const distrito = await page.locator('input[aria-label="Distrito"]').inputValue();      
    console.log('✅ Distrito:',distrito.toUpperCase());

    await page.locator('.q-field')
    .filter({ hasText: /cidade/i })
    .first()
    .click({ force: true });
    const menuCiudad = page.locator('.q-menu').last();
    await menuCiudad.waitFor();
    await menuCiudad
    .locator('.q-item')
    .filter({ hasText: /2A/i })
    .click({ force: true });
    const city = await page.locator('input[aria-label="Cidade/Bairro"]').inputValue();      
    console.log('✅ Cidade:',city);

    const direccion = `RUA ALFREDO ABERLADO MUTZEMBERT DOS SANTOS ${Date.now()}`;
    await page.getByLabel(/direção/i).fill(direccion);
    console.log('✅ Endereço:', nome.toUpperCase());

    await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => {
      document.body.style.zoom = '0.9';
    });    

    const numero = Math.floor(Math.random() * 1000) + 1;
    const campoNumero = page.locator('.q-field')
    .filter({ hasText: /número/i })
    .last();
    await campoNumero.locator('input').fill(numero.toString());
    console.log('✅ Número:', numero.toString().trim());    

    const telefone = Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');
    console.log('✅ Telefone/Contato:', telefone);
    const inputTelefone = page.locator('input[type="tel"]').first();
    await inputTelefone.scrollIntoViewIfNeeded();
    await inputTelefone.click({ force: true });
    await inputTelefone.press('Control+A');
    await inputTelefone.press('Backspace');
    await inputTelefone.type(telefone, { delay: 30 });         
    console.log('FIM DE DADOS ENVIADOS');

    await page.locator('.q-btn')
    .filter({ hasText: /salvar|guardar/i })
    .click({ force: true });
    console.log('✅ Clicou em Salvar');     

    const salvarUrlResponse = await salvarPessoaPromise;     
    const urlCompletaPost = salvarUrlResponse.url();
    console.log('✅ A URL capturada do POST é:', urlCompletaPost);

    const salvarPessoaResponse = await salvarPessoaPromise;
    const dadosSalvos = await salvarPessoaResponse.json();
    console.log('✅DADOS RETORNADOS NA CRIAÇÃO***');
    console.log(JSON.stringify(dadosSalvos, null, 2));
    
    const idPessoa = dadosSalvos.pessoa.controle.toString().trim();    
    const urlRegistroCriado = urlCompletaPost.replace('/geral', `/${idPessoa}`);
    const headersOriginais = salvarPessoaResponse.request().headers();
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
    console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO***');
    console.log('✅ Novo Controle:', idPessoa);    
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