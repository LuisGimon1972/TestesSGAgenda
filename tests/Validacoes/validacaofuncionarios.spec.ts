import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Validação de cadastro de funcionários', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await loginCompleto(page);

  await page.getByText(/funcionários/i).click({ force: true });
  const btnCadastrar = page.getByText(/cadastrar funcionário/i).first();
  await btnCadastrar.click();
  
  const nomefuncionario = `TEST FUNCIONARIO  ${Date.now()}`;
  const camponomefuncionario = page
  .locator('.q-field')
  .filter({ hasText: /funcionário/i })
  .first()
  .locator('input');
  await expect(camponomefuncionario).toBeVisible();
  await camponomefuncionario.fill(nomefuncionario);  
  console.log('CAMPO NOME FUNCIOÁRIO PREENCHIDO OK:', nomefuncionario);  

  const campoCargo = page.locator('.q-field').filter({ hasText: /cargo/i }).last().locator('input');
  await campoCargo.fill('A');
  console.log('CAMPO CARGO COM VALOR INVALIDO OK', campoCargo);  

  console.log('CAMPO CÉDULA DE IDENTIDAD VAZIO OK');  

  console.log('CAMPO USUÁRIO ATRELADO VAZIO OK');    
  
  await page.locator('.q-btn').filter({ hasText: /salvar|guardar/i }).click({ force: true });

  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);  
});
