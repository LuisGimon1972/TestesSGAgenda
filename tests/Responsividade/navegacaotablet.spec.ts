import { test, devices } from '@playwright/test';
import { loginCompletomobile } from '../../utils/logincompletomobile';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Navegação de Menus - Mobile', () => {
  test('Deve navegar por todos os menus principais no modo mobile', async ({ page }) => {
    test.setTimeout(90000);

    const tablet = devices['iPad (gen 6)'];
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.setExtraHTTPHeaders({ 'User-Agent': tablet.userAgent });

    page.on('pageerror', (err) => {
      const msg = err.message || '';
      if (/Element not found|Cannot read properties of null.*nextSibling|reading 'nextSibling'/i.test(msg)) {
        console.log(`⚠️ Erro ignorado da aplicação: ${msg}`);
      }
    });

    console.log('📱 Resolução alterada para Tablet.');    

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