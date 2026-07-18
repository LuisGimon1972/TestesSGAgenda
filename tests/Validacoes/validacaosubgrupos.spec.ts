import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Validação dados subgrupos', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);    
 
    const cadBtn = page.getByText(/cadastros/i).first();
    await expect(cadBtn).toBeVisible();
    await cadBtn.click();
    console.log('CLICOU EM CADASTRO');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/subgrupos"]').click()
    console.log('CLICOU EM SUBGRUPOS');

    const btnCadastrar = page.getByText(/cadastrar subgrupo/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });
    console.log('CLICOU CADASTRAR SUBGRUPO');    

    const nomesubgrupo = `TEST SUBGRUPO ${Date.now()}`;
    await page.getByLabel(/cadastrar novo subgrupo/i).fill(nomesubgrupo);
    console.log('NOME DE SUBGRUPO OK', nomesubgrupo);   

    await page.waitForTimeout(1000);    
    
    console.log('GRUPO VAZIO OK');    

    await page.waitForTimeout(1000);

    await page.locator('.q-btn')
    .filter({ hasText: /confirmar|guardar/i })
    .click({ force: true });
    console.log('CLICOU EM SALVAR SUBGRUPO');  

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});