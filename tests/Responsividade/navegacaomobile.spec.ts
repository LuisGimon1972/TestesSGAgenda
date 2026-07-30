import { test, devices } from '@playwright/test';
import { loginCompletomobile } from '../../utils/logincompletomobile';
import { formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Navegação de Menus - Mobile', () => {
  test('Deve navegar por todos os menus principais no modo mobile', async ({ page }) => {
    test.setTimeout(90000);

    const mobileDevice = devices['iPhone 12'];
    await page.setViewportSize(mobileDevice.viewport);
    await page.setExtraHTTPHeaders({ 'User-Agent': mobileDevice.userAgent });
    console.log('📱 Resolução alterada para Mobile.');    

    await page.context().clearCookies();
    await loginCompletomobile(page);    

    await page.waitForLoadState('networkidle');
    
    async function abrirMenuMobile() {
      
      const btnMenu = page.locator('header button, .q-header button, [aria-label*="menu" i], button:has(.q-icon), .q-layout__section--marginal button').first();
      
      if (await btnMenu.isVisible()) {
        await btnMenu.click({ force: true });      
        await page.locator('.q-item').first().waitFor({ state: 'visible', timeout: 3000 });
      }
    }
    
    async function navegarPara(nomeItem: string) {
      await abrirMenuMobile();
     
      
      const elementoAlvo = page.locator('.q-item, a, button').getByText(nomeItem, { exact: true }).first();
      await elementoAlvo.waitFor({ state: 'visible', timeout: 5000 });
      await elementoAlvo.scrollIntoViewIfNeeded();
      await elementoAlvo.click({ force: true });
      console.log(`✅ Clicou em ${nomeItem}`);      
      
      await page.waitForTimeout(800); 
    }
   
    const menus = [
      'Dashboard',
      'Agenda',
      'Clientes',
      'Atendentes',
      'Serviços',
      'Produtos',
      'Categorias',
      'Comissões',
      'Planos',
      'Configurações' 
    ];

    for (const menu of menus) {
      await navegarPara(menu);
    }

    const abasConfig = [
      'WhatsApp', 
      'Informações da empresa', 
      'Personalização', 
      'Pagamentos'
    ];

    for (const aba of abasConfig) {
      const abaElemento = page.getByText(aba, { exact: true });   
      await abaElemento.waitFor({ state: 'visible', timeout: 5000 });
      await abaElemento.click();
      console.log(`     ✅ Clicou na Aba ${aba}`);
    }

    await capturarRequisicoesApi(page);
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
    console.log('✅ Navegação mobile concluída com sucesso!');
  });
});