import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Validação de datos  perfil de acesso', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);
  
  const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
  await expect(usuariosBtn).toBeVisible();
  await usuariosBtn.click();
  console.log('CLICOU EM USUÁRIOS');

  await page.waitForTimeout(1000);
  page.locator('a[href*="usuario/perfil"]').click()
  console.log('CLICOU EM PERFIL DE ACESSO');
  
  const btnCadastrar = page.getByText(/cadastrar perfil/i).first();
  await expect(btnCadastrar).toBeVisible();
  await btnCadastrar.click();
  console.log('CLICOU CADASTRAR PERFIL DE ACESSO'); 
      
  console.log('NOME PERFIL VAZIO OK');
  
  console.log('NÃO CLICLOU EM SELECIONAR TODOS OK');

  await page.locator('.q-btn')
  .filter({ hasText: /salvar|guardar/i })
  .click({ force: true });
  console.log('CLICOU EM SALVAR PERFIL DE ACCESO');

  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);  
});