import { test } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { capturarRequisicaoApiCadastro } from '../../utils/capturaApipayload';

test('Teste de Desempenho de Cadastro de Pessoas', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const inicioLogin = Date.now();
    await loginCompleto(page);    
    const fimLogin = Date.now();

    const inicio = Date.now();

    await page.waitForTimeout(1000);
    await page.getByText(/pessoas/i).click({ force: true }); 
    console.log('CLICOU PESSOAS');
      
    const btnCadastrar = page.getByText(/cadastrar pessoas/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });
    console.log('CLICOU CADASTRAR');

    await page.locator('[aria-label="Natureza"]').click({ force: true });
    const menu = page.locator('.q-menu:visible');
    await menu.waitFor();
    await menu
    .locator('.q-item')
    .filter({ hasText: /não contribuinte/i })
    .first()
    .click({ force: true });
    console.log('NATURALEZA OK');

    await page.locator('[aria-label="Tipo do documento de identificação"]').click({ force: true });
    const menuDoc = page.locator('.q-menu').last();
    await menuDoc.waitFor();
    await menuDoc
    .locator('.q-item')
    .filter({ hasText: /carteira de identidade paraguaia/i })
    .click({ force: true });
    console.log('TIPO DE DOCUMENTO OK');
    
    await page.waitForTimeout(700);
    const ruc = gerarRUC();
    await page.getByLabel(/número de documento de identificação/i).fill(ruc);
    console.log('RUC:', ruc);
    
    await page.waitForTimeout(700);
    await page.locator('[aria-label="Tipo de operação"]').click({ force: true });
    const menuDoc1 = page.locator('.q-menu').last();
    await menuDoc1.waitFor();
    await menuDoc1
    .locator('.q-item')
    .filter({ hasText: /B2C/i })
    .click({ force: true }); 
    console.log('TIPO DE OPERAÇÃO OK');

    const nome = `TEST PESSOAS DESEMPENHO ${Date.now()}`;
    await page.getByLabel(/nome completo/i).fill(nome);
    console.log('NOMBRE DO CLIENTE OK:', nome);

    await page.locator('[aria-label="Tipo de cadastro"]').click({ force: true });
    const menuDoc2 = page.locator('.q-menu').last();
    await menuDoc2.waitFor();
    await menuDoc2
    .locator('.q-item')
    .filter({ hasText: /cliente/i })
    .click({ force: true });
    console.log('TIPO DE CADASTRO OK');

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
    console.log('DEPARTAMENTO OK');

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
    console.log('DISTRITO OK');

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
    console.log('CIUDAD OK');

    const direccion = `TEST DIRECCION ${Date.now()}`;
    await page.getByLabel(/direção/i).fill(direccion);
    console.log('DIRECCIÓN OK', direccion);

    const numero = Math.floor(Math.random() * 1000) + 1;
    const campoNumero = page.locator('.q-field')
    .filter({ hasText: /número/i })
    .last();
    await campoNumero.locator('input').fill(numero.toString());
    console.log('NUMERO OK:', numero);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const telefone = Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');    
    const inputTelefone = page.locator('input[type="tel"]').first();
    await inputTelefone.scrollIntoViewIfNeeded();
    await inputTelefone.click({ force: true });
    await inputTelefone.press('Control+A');
    await inputTelefone.press('Backspace');
    await inputTelefone.type(telefone, { delay: 30 });
    console.log('TELEFONE OK:', telefone);    

    await page.locator('.q-btn')
    .filter({ hasText: /salvar|guardar/i })
    .click({ force: true });
    console.log('CLICOU EM SALVAR');   
    
    await capturarRequisicaoApiCadastro(page, '/api/py/pessoa'); 
   
    await capturarRequisicoesApi(page);       
    
    const tempoLogin = fimLogin - inicioLogin;
    console.log(`⏱️Tempo total do Login: ${tempoLogin} ms`);

    const fim = Date.now();
    const tempoTotal = fim - inicio;
    console.log(`⏱️Tempo total do Cadastro: ${tempoTotal} ms`);    
    if (tempoTotal > 8000) {
       console.log('⚠️ Tempo acima do limite esperado [8000 ms]');
    }else {
        console.log(`✅ Tempo do cadastro dentro do limite[8000 ms]: ${tempoTotal} ms`);
    }
   
    const totalGeral = tempoLogin + tempoTotal;
    console.log(`⏱️Tempo total Módulo: ${totalGeral} ms`);

function gerarRUC() {
  const base = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 dígitos
  const pesos = [2,3,4,5,6,7,2];
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += parseInt(base[i]) * pesos[i];
  }
  const resto = soma % 11;
  const dv = resto > 1 ? 11 - resto : 0;
  return `${base}-${dv}`;
}

});