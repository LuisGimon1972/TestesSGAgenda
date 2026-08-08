import { Page } from '@playwright/test';

export async function clicarElementoMenu(page: Page, nomeItem: string) {
  let elementoAlvo = page.getByText(nomeItem, { exact: true }).first();
  
  if (!(await elementoAlvo.isVisible())) {
    elementoAlvo = page.locator('.q-item, a, button').filter({ hasText: new RegExp(`^${nomeItem}$`, 'i') }).first();
  }

  await elementoAlvo.waitFor({ state: 'visible', timeout: 5000 });
  await elementoAlvo.scrollIntoViewIfNeeded().catch(() => {});
  
  try {
    await elementoAlvo.click({ timeout: 3000 });
  } catch {
    await elementoAlvo.click({ force: true });
  }
}

export async function navegarPara(page: Page, principal: string, sub?: string) {
  if (sub) {     
    let submenuAlvo = page.getByText(sub, { exact: true }).first();
    if (!(await submenuAlvo.isVisible())) {
      submenuAlvo = page.locator('.q-item, a, button').filter({ hasText: new RegExp(`^${sub}$`, 'i') }).first();
    }
    
    if (!(await submenuAlvo.isVisible())) {
      await clicarElementoMenu(page, principal);
      await page.waitForTimeout(1500); 
    }
    
    await clicarElementoMenu(page, sub);
    console.log(`✅ Navegou para: ${principal} > ${sub}`);
  } else {        
    await clicarElementoMenu(page, principal);
    console.log(`✅ Navegou para: ${principal}`);
  }      
  
  await page.waitForTimeout(1500);      
}