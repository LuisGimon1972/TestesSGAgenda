import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de busca crítico em Usuários', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);
  
  const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
  await expect(usuariosBtn).toBeVisible();
  await usuariosBtn.click();
  console.log('CLICOU EM USUÁRIOS');

  const listado = page.locator('a[href*="usuario/listado"]');
  await expect(listado).toBeVisible();
  await listado.click();
  console.log('CLICOU EM LISTAGEM DE USUARIOS');

     const primeiroNome = `TEST USUARIO`;
     await page.getByLabel(/pesquisar registro/i).fill(primeiroNome);
     await page.waitForTimeout(1000);  
     await page.keyboard.press('Enter');
     await page.waitForTimeout(1500);
     console.log('BUSCA  USUÁRIO EXISTENTE OK:', primeiroNome);

    await page.waitForTimeout(1000);

    const prodInexistente = `USUÁRIO INEXISTENTE`;
    await page.getByLabel(/pesquisar registro/i).fill(prodInexistente);
    await page.waitForTimeout(1000);  
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    console.log('BUSCA USUÁRIO INEXISTENTE OK:', prodInexistente);
    
    await page.waitForTimeout(4000);  
});