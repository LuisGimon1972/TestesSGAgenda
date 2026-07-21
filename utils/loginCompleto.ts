import { Page } from '@playwright/test';
import { talVez } from '../utils/talvez';
import { fecharPopupAtualizacao } from '../utils/novidade';

export async function loginCompleto(page: Page) {

  console.log('INICIO');
  await page.goto(process.env.BASE_URL!);
  console.log('✅ Abriu Site');
  await page.getByText(/log in|entrar/i).click();
  console.log('✅ Clicou em Entrar');
  
  await page.waitForSelector('input[type="email"], input[type="text"]', {
    timeout: 15000
  });
  //await page.waitForTimeout(1000);
  console.log('✅ Apareceu Form Login');  
  await page.locator('input[type="email"], input[type="text"]').first().fill(process.env.USER!);
  await page.locator('input[type="password"]').first().fill(process.env.PASS!);
  //await page.waitForTimeout(1000);
  console.log('✅ Login Preenchido');  
  await page.getByRole('button', { name: /entrar/i }).click();
  console.log('✅ Clicou em Entrar');
  
  //await page.waitForURL(/empresas/, { timeout: 20000 });
  //console.log('✅ Chegou em Empresa');  
  
/*  const botao = page.locator('button:has-text("ENTRAR")').nth(0);
  //const botao = page.locator('button:has-text("ENTRAR")').first();
  await botao.highlight();
  await botao.evaluate((el: any) => {
    el.style.border = '5px solid red';
    el.click();
  });
  console.log('✅ Clicou em Entrar ao Sistema');*/

  const botao1 = page.locator('button:has-text("Acessar")').nth(4);
  //const botao = page.locator('button:has-text("ENTRAR")').first();
  await botao1.highlight();
  await botao1.evaluate((el: any) => {
    el.style.border = '5px solid red';
    el.click();
  });
  console.log('✅ Clicou em Acessar Empresa');

  await page.waitForTimeout(3000);
  console.log('🌐 URL:', await page.url()); 

  
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
  
  await fecharPopupAtualizacao(page)   

 // await talVez(page);   
}