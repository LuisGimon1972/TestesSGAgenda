import { test, expect } from '@playwright/test';
import { loginCompleto } from '../utils/loginCompleto';
import { capturarRequisicoesApi } from '../utils/capturaApi';

test('Navegação de menus', async ({ page }) => {
    await loginCompleto(page);    

    const dashboardBtn = page.getByText(/dashboard/i).first();
    await expect(dashboardBtn).toBeVisible({ timeout: 5000 });
    await dashboardBtn.click();
    console.log('CLICOU EM DASKBOARD');      

    await page.waitForTimeout(500);
        
    await page.locator('.q-item').filter({ hasText: 'Agenda' }).click();
    console.log('CLICOU EM AGENDA');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Clientes' }).click();
    console.log('CLICOU EM CLIENTES');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Atendentes' }).click();
    console.log('CLICOU EM ATENDENTES');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Serviços' }).click();
    console.log('CLICOU EM SERVIÇOS');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Produtos' }).click();
    console.log('CLICOU EM PRODUTOS');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Categorias' }).click();
    console.log('CLICOU EM CATEGORIAS');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Comissões' }).click();
    console.log('CLICOU EM COMISSÕES');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Planos' }).click();
    console.log('CLICOU EM PLANOS');      

    await page.waitForTimeout(500);

        await page.locator('.q-item').filter({ hasText: 'Configurações' }).click();
    console.log('CLICOU EM  CONFIGURAÇÕES');           


    await capturarRequisicoesApi(page);            
    await page.waitForTimeout(2000);
});