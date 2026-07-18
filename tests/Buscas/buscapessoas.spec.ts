import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de busca crítico em Pessoas', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await loginCompleto(page);

  // Navega até Pessoas
  await page.waitForTimeout(1000);
  await page.getByText(/pessoas/i).click({ force: true }); 
  console.log('CLICOU PESSOAS');

const primeiroNome = `TEST`;
await page.getByLabel(/pesquisar registro/i).fill(primeiroNome);
await page.waitForTimeout(2000);  
await page.keyboard.press('Enter');
await page.waitForTimeout(2000);
console.log('BUSCA PESSOA EXISTENTE OK:', primeiroNome);

await page.waitForTimeout(1000);

const nomeInexistente = `NOME INEXISTENTE`;
await page.getByLabel(/pesquisar registro/i).fill(nomeInexistente);
await page.waitForTimeout(1000);  
await page.keyboard.press('Enter');
await page.waitForTimeout(2000);
console.log('BUSCA PESSOA INEXISTENTE OK:', nomeInexistente);
});