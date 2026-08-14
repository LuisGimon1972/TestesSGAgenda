import { Page } from '@playwright/test';
import { fecharPopupAtualizacao } from '../utils/novidade';

export function formatarDataHora(date: Date): string {
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0'); // meses começam em 0
  const ano = date.getFullYear();

  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  const segundos = String(date.getSeconds()).padStart(2, '0');

  return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
}

export async function loginCompleto(page: Page) {
  let inicioTeste = new Date();
  console.log(`🕒 Início do teste: ${formatarDataHora(inicioTeste)}`);    
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
  
  console.log('🌐 URL:', page.url()); 
  
  await page.evaluate(() => {
    document.querySelectorAll('.q-dialog, .q-dialog__backdrop, .q-overlay').forEach((el: any) => {
      el.remove();
    });
  }); 
  
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
}