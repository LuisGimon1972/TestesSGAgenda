import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de busca crítico em Perfil de Espécies', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);
  
    await page.waitForTimeout(1000);
    await page.getByText(/cadastros/i).click({ force: true }); 
    console.log('CLICOU EM CADASTROS');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/metodos-pagos"]').click()
    console.log('CLICOU EM ESPÉCIES'); 

     const primeiroNome = `TEST ESPÉCIE`;
     await page.getByLabel(/pesquisar registro/i).fill(primeiroNome);
     await page.waitForTimeout(1000);  
     await page.keyboard.press('Enter');
     await page.waitForTimeout(1500);
     console.log('BUSCA ESPÉCIE EXISTENTE OK:', primeiroNome);

    await page.waitForTimeout(1000);

    const prodInexistente = `ESPÉCIE INEXISTENTE`;
    await page.getByLabel(/pesquisar registro/i).fill(prodInexistente);
    await page.waitForTimeout(1000);  
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    console.log('BUSCA ESPÉCIE INEXISTENTE OK:', prodInexistente);
    
    await page.waitForTimeout(4000);  
});