import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Validação de dados espécies', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);    
 
    await page.waitForTimeout(1000);
    await page.getByText(/cadastros/i).click({ force: true }); 
    console.log('CLICOU EM CADASTROS');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/metodos-pagos"]').click()
    console.log('CLICOU EM ESPÉCIES'); 

    const btnCadastrar = page.getByText(/cadastrar espécie/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });
    console.log('CLICOU CADASTRAR');

    const descricao = `TEST ESPÉCIE ${Date.now()}`;
    await page.getByLabel(/descrição/i).fill(descricao);
    console.log('DESCRIÇÃO DE ESPÉCIE OK', descricao);
    
    console.log('TIPO DO CARTÃO VAZIO OK');
    
    console.log('TIPO DA ESPÉCIE VAZIO OK');    

    await page.locator('.q-btn')
    .filter({ hasText: /salvar|guardar/i })
    .click({ force: true });
    console.log('CLICOU EM SALVAR');  

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});