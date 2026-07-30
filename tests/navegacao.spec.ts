import { test, expect } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../utils/loginCompleto';
import { capturarRequisicoesApi } from '../utils/capturaApi';

test('Navegação de menus', async ({ page }) => {
    await loginCompleto(page);    

    const dashboardBtn = page.getByText(/dashboard/i).first();
    await expect(dashboardBtn).toBeVisible({ timeout: 5000 });
    await dashboardBtn.click();
    console.log('✅ Clicou em Dashboard');      

    await page.waitForTimeout(500);
        
    await page.locator('.q-item').filter({ hasText: 'Agenda' }).click();
    console.log('✅ Clicou em Agenda');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Clientes' }).click();
    console.log('✅ Clicou em Clientes');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Atendentes' }).click();
    console.log('✅ Clicou em Atendentes');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Serviços' }).click();
    console.log('✅ Clicou em Serviços');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Produtos' }).click();
    console.log('✅ Clicou em Produtos');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Categorias' }).click();
    console.log('✅ Clicou em Categorias');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Comissões' }).click();
    console.log('✅ Clicou em Comissões');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Planos' }).click();
    console.log('✅ Clicou em Planos');      

    await page.waitForTimeout(500);

    await page.locator('.q-item').filter({ hasText: 'Configurações' }).click();
    console.log('✅ Clicou em Configurações');           

    await page.waitForTimeout(200);

    await page.getByText('WhatsApp', { exact: true }).click();
    console.log('     ✅ Clicou na Aba WhatsApp');           

    await page.waitForTimeout(200);

    await page.getByText('Informações da empresa', { exact: true }).click();
    console.log('     ✅ Clicou na Aba Informações da empresa');           

    await page.waitForTimeout(200);

    await page.getByText('Personalização', { exact: true }).click();
    console.log('     ✅ Clicou na Aba Personalização');           

    await page.waitForTimeout(200);

    await page.getByText('Pagamentos', { exact: true }).click();
    console.log('     ✅ Clicou na Aba Pagamentos');          

    await capturarRequisicoesApi(page);            
    await page.waitForTimeout(2000);
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
});