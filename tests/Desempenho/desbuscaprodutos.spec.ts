import { test } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de Desempenho de buscas em Produtos', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
      
    const inicioLogin = Date.now();
    await loginCompleto(page);    
    const fimLogin = Date.now();

    await page.waitForTimeout(1000);
    await Promise.all([
    page.waitForURL(/producto/, { timeout: 15000 }),
    page.locator('a[href*="producto"]').first().click()
    ]);
    console.log('CLICOU PRODUTOS');
    const primeiroNome = `TEST PRODUTO`;
    const inicioBuscaExistente = Date.now();
    await page.getByLabel(/pesquisar registro/i).fill(primeiroNome);     
    await page.keyboard.press('Enter');     
    const fimBuscaExistente = Date.now();
    const tempoBuscaExistente = fimBuscaExistente - inicioBuscaExistente;
    console.log('BUSCA PRODUTO EXISTENTE OK:', primeiroNome);

    await page.waitForTimeout(1000);

    const prodInexistente = `PRODUTO INEXISTENTE`;
    const inicioBuscaInexistente = Date.now();
    await page.getByLabel(/pesquisar registro/i).fill(prodInexistente);    
    await page.keyboard.press('Enter');    
    const fimBuscaInexistente = Date.now();
    const tempoBuscaInexistente = fimBuscaInexistente - inicioBuscaInexistente;    
    console.log('BUSCA PRODUTO INEXISTENTE OK:', prodInexistente);

    const tempoLogin = fimLogin - inicioLogin;
    console.log(`⏱️Tempo total do Login: ${tempoLogin} ms`);

    const tempoTotal = tempoBuscaExistente + tempoBuscaInexistente;
    console.log(`⏱️Tempo total das buscas: ${tempoTotal} ms`);
    if (tempoTotal > 1000) {
        console.log('⚠️ Tempo acima do limite esperado [1000 ms]');
    }else {
        console.log(`✅ Tempo da busca dentro do limite[1000 ms]: ${tempoTotal} ms`);
    }

    const totalGeral = tempoLogin + tempoTotal;
    console.log(`⏱️Tempo total Módulo: ${totalGeral} ms`);       
});