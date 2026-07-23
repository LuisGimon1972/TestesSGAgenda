import { Page, expect } from '@playwright/test';
import { talVez } from '../utils/talvez';
import { fecharPopupAtualizacao } from '../utils/novidade';

export async function loginCompletomobile(page: Page) {
  console.log('INICIO (MOBILE)');
  await page.goto(process.env.BASE_URL!);
  console.log('✅ Abriu Site');
  
  await page.getByText(/log in|entrar/i).click();
  console.log('✅ Clicou em Entrar');
  
  await page.waitForSelector('input[type="email"], input[type="text"]', {
    timeout: 15000
  });

  console.log('✅ Apareceu Form Login');  
  await page.locator('input[type="email"], input[type="text"]').first().fill(process.env.USER!);
  await page.locator('input[type="password"]').first().fill(process.env.PASS!);

  console.log('✅ Login Preenchido');  
  await page.getByRole('button', { name: /entrar/i }).click();
  console.log('✅ Clicou em Entrar'); 

  const botao1 = page.locator('button:has-text("Acessar")').nth(3);
  await botao1.highlight();
  await botao1.evaluate((el: any) => {
    el.style.border = '5px solid red';
    el.click();
  });
  console.log('✅ Clicou em Acessar Empresa');

  await page.waitForTimeout(3000);
  console.log('🌐 URL:', await page.url()); 
  
  // Remoção de modais e overlays do Quasar Framework
  await page.evaluate(() => {
    document.querySelectorAll('.q-dialog, .q-dialog__backdrop, .q-overlay').forEach((el: any) => {
      el.remove();
    });
  });
  
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    document.querySelectorAll('.q-dialog, .q-dialog__backdrop, .q-overlay').forEach((el: any) => {
      el.remove();
    });
  });

  console.log('✅ Modal + Overlay Removidos');

  const botaoFecharPopup = page.locator('button:has-text("×"), svg[aria-label="Close"], .modal-close');

  if (await botaoFecharPopup.isVisible()) {
    console.log('Popup de atualização detectado, fechando...');
    await botaoFecharPopup.click().catch(() => {});
    console.log('Popup fechado com sucesso.');
  }
  
  await fecharPopupAtualizacao(page);   

  // ----------------------------------------------------
  // ABRE O MENU MOBILE COM SEGURANÇA E FALLBACKS MÚLTIPLOS
  // ----------------------------------------------------
  console.log('🔄 Tentando localizar e abrir o menu mobile...');

  const seletoresMenu = [
    page.getByLabel(/menu/i),
    page.locator('header button, .q-header button').first(),
    page.locator('[aria-label*="menu" i]').first(),
    page.locator('button:has(.q-icon), .q-btn:has(.q-icon)').first(),
    page.locator('.q-layout__section--marginal button').first(),
    page.locator('button[class*="menu"], .q-btn[class*="menu"]').first()
  ];

  let menuClicado = false;

  for (const seletor of seletoresMenu) {
    try {
      if (await seletor.isVisible({ timeout: 2000 })) {
        await seletor.click({ force: true });
        menuClicado = true;
        console.log('✅ Menu mobile clicado com sucesso');
        break;
      }
    } catch (e) {
      // Ignora erro e tenta o próximo seletor da lista
    }
  }

  if (!menuClicado) {
    const botaoGenerico = page.locator('header button, ion-menu-button, [role="button"]').first();
    await botaoGenerico.click({ force: true });
    console.log('✅ Menu mobile clicado via fallback genérico');
  }

  await page.waitForTimeout(800);
  // await talVez(page);   
}