import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Validação cadastro de pessoas', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await loginCompleto(page);

  await page.waitForTimeout(1000);
  await page.getByText(/pessoas/i).click({ force: true }); 
  console.log('CLICOU PESSOAS');
      
  const btnCadastrar = page.getByText(/cadastrar pessoas/i).first();
  await btnCadastrar.waitFor();
  await btnCadastrar.click({ force: true });
  console.log('CLICOU CADASTRAR');
  
  await page.locator('[aria-label="Natureza"]').click({ force: true });
  await page.locator('.q-menu:visible .q-item')
    .filter({ hasText: /não contribuinte/i })
    .click({ force: true });
  
  await page.locator('[aria-label="Tipo do documento de identificação"]').click({ force: true });
  await page.locator('.q-menu').last()
    .locator('.q-item')
    .filter({ hasText: /carteira de identidade paraguaia/i })
    .click({ force: true });
    console.log('SEM PREENCHER NOME --ERRO ESPERADO');
    console.log('SEM PREENCHER DOCUMENTO --ERRO ESPERADO');  
    console.log('SEM PREENCHER DEPARTAMENTO --ERRO ESPERADO');  

  await page.locator('[aria-label="Tipo de operação"]').click({ force: true });
  await page.waitForTimeout(700);
  await page.locator('[aria-label="Tipo de operação"]').click({ force: true });
  const menuDoc1 = page.locator('.q-menu').last();
  await menuDoc1.waitFor();
  await menuDoc1
  .locator('.q-item')
  .filter({ hasText: /B2C/i })
  .click({ force: true }); 
  console.log('TIPO DE OPERAÇÃO OK');

  await page.evaluate(() => {
  window.scrollTo({
  top: document.body.scrollHeight,
  behavior: 'smooth'
  });
  });

  await page.locator('.q-btn')
  .filter({ hasText: /salvar|guardar/i })
  .click({ force: true });
  console.log('TENTOU SALVAR COM ERRO');
  
  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);  
  console.log('VALIDAÇÃO OK');  
});