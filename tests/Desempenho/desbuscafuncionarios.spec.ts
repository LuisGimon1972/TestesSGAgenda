import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de Desempenho de buscas em Funcionários', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const inicioLogin = Date.now();
    await loginCompleto(page);    
    const fimLogin = Date.now();
  
    await page.waitForTimeout(1000);
    await page.getByText(/funcionários/i).click({ force: true });
    console.log('CLICOU EM FUNCIONÁRIOS'); 
    await page.waitForTimeout(1000);       
    const primeiroNome = `TEST FUNCIONARIO`;
    const inicioBuscaExistente = Date.now();
    await page.waitForTimeout(200);
    await page.getByLabel(/pesquisar registro/i).fill(primeiroNome);    
    await page.keyboard.press('Enter');    
    const fimBuscaExistente = Date.now();
    const tempoBuscaExistente = fimBuscaExistente - inicioBuscaExistente;
    console.log('BUSCA FUNCIONÁRIO EXISTENTE OK:', primeiroNome);

    await page.waitForTimeout(1000);

    const prodInexistente = `FUNCIONARIO INEXISTENTE`;
    const inicioBuscaInexistente = Date.now();
    await page.getByLabel(/pesquisar registro/i).fill(prodInexistente);    
    await page.keyboard.press('Enter');    
    const fimBuscaInexistente = Date.now();
    const tempoBuscaInexistente = fimBuscaInexistente - inicioBuscaInexistente;
    console.log('BUSCA FUNCIONÁRIO INEXISTENTE OK:', prodInexistente);

    const tempoLogin = fimLogin - inicioLogin;
    console.log(`⏱️ Tempo total do Login: ${tempoLogin} ms`);

    const tempoTotal = tempoBuscaExistente + tempoBuscaInexistente;
    console.log(`⏱️ Tempo total das buscas: ${tempoTotal} ms`);
    if (tempoTotal > 1000) {
        console.log('⚠️ Tempo acima do limite esperado [1000 ms]');
    }else {
        console.log(`✅ Tempo da busca dentro do limite[1000 ms]: ${tempoTotal} ms`);
    }
    const totalGeral = tempoLogin + tempoTotal;
    console.log(`⏱️Tempo total Módulo: ${totalGeral} ms`);
});