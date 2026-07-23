import { test, devices } from '@playwright/test';
import { loginCompletomobile } from '../../utils/logincompletomobile';
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
    await page.waitForTimeout(2000);
    
    async function abrirMenuMobile() {
      const botoesMenu = [
        page.locator('header button, .q-header button').first(),
        page.locator('[aria-label*="menu" i]').first(),
        page.locator('button:has(.q-icon)').first(),
        page.locator('.q-layout__section--marginal button').first()
      ];

      for (const btn of botoesMenu) {
        try {
          if (await btn.isVisible({ timeout: 1500 })) {
            await btn.click({ force: true });
            await page.waitForTimeout(600);
            return;
          }
        } catch (e) {}
      }
    }
    
    async function navegarPara(nomeItem: string) {
      await abrirMenuMobile();
      await page.waitForTimeout(600);
     
      const itens = page.locator('.q-item, a, button').filter({ hasText: new RegExp(nomeItem, 'i') });
      const quantidade = await itens.count();
      
      let elementoAlvo = null;
      for (let i = 0; i < quantidade; i++) {
        const item = itens.nth(i);
        if (await item.isVisible()) {
          const texto = await item.textContent();
          if (texto && texto.trim().toLowerCase() === nomeItem.toLowerCase()) {
            elementoAlvo = item;
            break;
          }
        }
      }
      
      if (!elementoAlvo) {
        elementoAlvo = itens.first();
      }

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

    await capturarRequisicoesApi(page);
    await page.waitForTimeout(2000);
    console.log('✅ Navegação mobile concluída com sucesso!');
  });
});