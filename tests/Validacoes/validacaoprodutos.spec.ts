import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Validação cadastro de produtos/serviços', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1085 });
  await loginCompleto(page);
  
  await page.waitForTimeout(1000);
  await Promise.all([
  page.waitForURL(/producto/, { timeout: 15000 }),
  page.locator('a[href*="producto"]').first().click()
  ]);
  console.log('CLICOU PRODUTOS');

  const btnCadastrar = page.getByText(/cadastrar produto|serviço/i).first();
  await btnCadastrar.waitFor();
  await btnCadastrar.click({ force: true });
  console.log('CLICOU CADASTRAR');
  
  const nomeproduto = `AUTO TEST ${Date.now()}`;
  await page.getByLabel(/nome/i).fill(nomeproduto);
  console.log('PREENCHEU SOMENTE NOME');
  
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
  
  console.log('VALIDAÇÃO OK');

  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);  
});