import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de busca crítico em DAV', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page); 

  const venBtn = page.getByText(/vendas/i).first();
  await expect(venBtn).toBeVisible();
  await venBtn.click();
  console.log('CLICOU EM VENDAS');
  
  await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForURL(/dav/, { timeout: 15000 }),
      page.locator('a[href*="dav"]').first().click()
    ]);
    console.log('CLICOU EM DAV');

     const davNome = `REGISTRO`;
     await page.getByLabel(/pesquisar registro/i).fill(davNome);
     await page.waitForTimeout(1000);  
     await page.keyboard.press('Enter');
     await page.waitForTimeout(1500);
     console.log('BUSCA DAV EXISTENTE OK:', davNome);

    await page.waitForTimeout(1000);

    const davInexistente = `CLIENTE DAV INEXISTENTE`;
    await page.getByLabel(/pesquisar registro/i).fill(davInexistente);
    await page.waitForTimeout(1000);  
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    console.log('BUSCA DAV INEXISTENTE OK:', davInexistente);
    
    await page.waitForTimeout(4000);  
});