import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de busca crítico em Perfil de Acesso', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);
  
    const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
    await expect(usuariosBtn).toBeVisible({ timeout: 5000 });
    await usuariosBtn.click();
    console.log('CLICOU EM USUÁRIOS');    

    await page.waitForTimeout(1000);
    page.locator('a[href*="usuario/perfil"]').click()
    console.log('CLICOU EM PERFIL DE ACESSO');

     const primeiroNome = `TEST PERFIL`;
     await page.getByLabel(/pesquisar registro/i).fill(primeiroNome);
     await page.waitForTimeout(1000);  
     await page.keyboard.press('Enter');
     await page.waitForTimeout(1500);
     console.log('BUSCA PERFIL EXISTENTE OK:', primeiroNome);

    await page.waitForTimeout(1000);

    const prodInexistente = `PERFIL INEXISTENTE`;
    await page.getByLabel(/pesquisar registro/i).fill(prodInexistente);
    await page.waitForTimeout(1000);  
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    console.log('BUSCA PERFIL INEXISTENTE OK:', prodInexistente);
    
    await page.waitForTimeout(4000);  
});