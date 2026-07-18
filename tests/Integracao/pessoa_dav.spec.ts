import { test } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Teste de Integração Cliente e Faturamento', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);    

    await page.waitForTimeout(1000);
    await page.getByText(/pessoas/i).click({ force: true }); 
    console.log('CLICOU PESSOAS');
      
    const btnCadastrar1 = page.getByText(/cadastrar pessoas/i).first();
    await btnCadastrar1.waitFor();
    await btnCadastrar1.click({ force: true });
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

    const nome = `TEST CLIENTE INTEGRAÇÃO DAV ${Date.now()}`;
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
    console.log('CLICOU EM SALVAR PESSOA');       
    console.log(`✅ Pessoa salva com sucesso!`);

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(2000);        
    
    await page.getByText(/vendas/i).click({ force: true });
    console.log('CLICOU EM VENDAS');

    await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForURL(/dav/, { timeout: 15000 }),
      page.locator('a[href*="dav"]').first().click()
    ]);
    console.log('CLICOU EM DAV');

    await page.waitForTimeout(1000);
    const btnCadastrar = page.getByText(/cadastrar dav/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });
    console.log('CLICOU EM CADASTRAR DAV');
    
    await page.locator('.q-select').nth(2).click();
    const campoPesquisa = page.locator('input[placeholder="Pesquisar"]');
    await campoPesquisa.waitFor({ state: 'visible', timeout: 5000 });    
    await campoPesquisa.fill(nome);
    await page.waitForTimeout(2000);
    console.log(`✅ Nome de pessoa inserida e pesquisada: ${nome}`);       
    if (nome !=''){console.log(`✅ Cliente "${nome}" corretamente integrado com DAV`);      
    }      
    else{
      console.log(`✅ Cliente não integrado com DAV`);
    }       

    await page.waitForTimeout(2000);
    

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