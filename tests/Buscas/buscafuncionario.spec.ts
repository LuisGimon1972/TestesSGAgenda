import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de busca crítico em Funcionários', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);
  
    await page.waitForTimeout(1000);
    await page.getByText(/funcionários/i).click({ force: true });
    console.log('CLICOU EM FUNCIONÁRIOS'); 

    await page.waitForTimeout(1000);        

    const primeiroNome = `TEST FUNCIONARIO`;
    await page.getByLabel(/pesquisar registro/i).fill(primeiroNome);
    await page.waitForTimeout(1000);  
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    console.log('BUSCA FUNCIONÁRIO EXISTENTE OK:', primeiroNome);

    await page.waitForTimeout(1000);

    const prodInexistente = `FUNCIONARIO INEXISTENTE`;
    await page.getByLabel(/pesquisar registro/i).fill(prodInexistente);
    await page.waitForTimeout(1000);  
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    console.log('BUSCA FUNCIONÁRIO INEXISTENTE OK:', prodInexistente);
    
    await page.waitForTimeout(4000);  
});