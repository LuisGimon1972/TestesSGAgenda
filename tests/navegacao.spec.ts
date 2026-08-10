import { test } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../utils/loginCompleto';
import { capturarRequisicoesApi } from '../utils/capturaApi';

test('Navegação de menus', async ({ page }) => {   
    test.setTimeout(90000);

    await loginCompleto(page);        
    await page.context().clearCookies();
    await page.waitForTimeout(2000);       

    //await capturarRequisicoesApi(page);        
    
    async function clicarElementoMenu(nomeItem: string) {
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
    
    async function navegarPara(principal: string, sub?: string) {
      
      if (sub) {     
        let submenuAlvo = page.getByText(sub, { exact: true }).first();
        if (!(await submenuAlvo.isVisible())) {
          submenuAlvo = page.locator('.q-item, a, button').filter({ hasText: new RegExp(`^${sub}$`, 'i') }).first();
        }
        
        if (!(await submenuAlvo.isVisible())) {
          await clicarElementoMenu(principal);
          await page.waitForTimeout(1500); 
        }
        
        await clicarElementoMenu(sub);
        console.log(`✅ Navegou para: ${principal} > ${sub}`);
      } else {        
        await clicarElementoMenu(principal);
        console.log(`✅ Navegou para: ${principal}`);
      }      
      
      await page.waitForTimeout(1500);      
    }  
    
    const fluxoNavegacao = [      
      { principal: 'Agendamentos' },
      { principal: 'Clientes' },          
      { principal: 'Profissionais' },                         
      { principal: 'Catálogo' , sub: 'Serviços' },    
      { principal: 'Catálogo' , sub: 'Produtos' },    
      { principal: 'Catálogo' , sub: 'Categorias' },    
      { principal: 'Planos' },
      { principal: 'Comissões' }     
    ];

    for (const item of fluxoNavegacao) {
      await navegarPara(item.principal, item.sub);
    }    
    console.log('✅ Navegação mobile concluída com sucesso!');
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
  });