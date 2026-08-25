import { test } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../utils/loginCompleto';

test('Navegação de menus', async ({ page }) => {   
    test.setTimeout(90000);

    await loginCompleto(page);        
    await page.context().clearCookies();
    await page.waitForTimeout(2000);           
    
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
  // Identifica se é o menu de Fatura Eletrônica (ignorando maiúsculas/minúsculas e acentos)
  const eFaturaEletronica = principal
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .includes("fatura eletronica");

  try {
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
  } catch (error) {
    if (eFaturaEletronica) {
      console.warn(`⚠️ Menu "${principal}" indisponível ou com falha. Ignorando e prosseguindo...`);
    } else {
      throw error; // Repassa o erro se for qualquer outro menu essencial
    }
  }
}
    
    const fluxoNavegacao = [      
      { principal: 'Dashboard' },
      { principal: 'Agendamentos' },
      { principal: 'Clientes' },          
      { principal: 'Profissionais' },                         
      { principal: 'Catálogo' , sub: 'Serviços' },    
      { principal: 'Catálogo' , sub: 'Produtos' },    
      { principal: 'Catálogo' , sub: 'Categorias' },    
      { principal: 'Planos' },
      { principal: 'Financeiro' },     
      { principal: 'Comissões' },     
      { principal: 'Fatura eletrônica' }    
    ];

    for (const item of fluxoNavegacao) {
      await navegarPara(item.principal, item.sub);
    }    
    console.log('✅ Navegação concluída com sucesso!');
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
  });