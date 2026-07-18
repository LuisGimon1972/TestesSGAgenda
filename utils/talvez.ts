import { Page } from '@playwright/test';

export async function talVez(page: Page) {
   await page.locator('.q-btn')
      .filter({ hasText: /talvez depois/i })
      .click({ force: true });
      console.log('CLICOU EM TALVEZ'); 
}