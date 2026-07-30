import { test, devices, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Navegação de Menus - Tablet', () => {
  test('Deve navegar por todos os menus principais no modo mobile', async ({ page }) => {
    test.setTimeout(90000);       

    const tablet = devices['iPad (gen 6)'];
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setExtraHTTPHeaders({ 'User-Agent': tablet.userAgent });
    
    console.log('📱 Resolução alterada para Tablet.');    
    await loginCompleto(page);    

    await page.context().clearCookies();
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

    // ==========================================
    // CORREÇÃO: Aguardando as abas renderizarem
    // ==========================================

    const abaWhatsapp = page.getByText('WhatsApp', { exact: true });
    await abaWhatsapp.waitFor({ state: 'visible', timeout: 5000 });
    await abaWhatsapp.click();
    console.log('     ✅ Clicou na Aba WhatsApp');           

    const abaInfo = page.getByText('Informações da empresa', { exact: true });
    await abaInfo.waitFor({ state: 'visible', timeout: 5000 });
    await abaInfo.click();
    console.log('     ✅ Clicou na Aba Informações da empresa');           

    const abaPersonalizacao = page.getByText('Personalização', { exact: true });
    await abaPersonalizacao.waitFor({ state: 'visible', timeout: 5000 });
    await abaPersonalizacao.click();
    console.log('     ✅ Clicou na Aba Personalização');           

    const abaPagamentos = page.getByText('Pagamentos', { exact: true });
    await abaPagamentos.waitFor({ state: 'visible', timeout: 5000 });
    await abaPagamentos.click();
    console.log('     ✅ Clicou na Aba Pagamentos');          

    await capturarRequisicoesApi(page);            
    await page.waitForTimeout(2000);
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
  });
});