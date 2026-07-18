import { test, expect } from '@playwright/test';
import { loginCompletomobile } from '../../utils/logincompletomobile';
import { Page } from '@playwright/test';

test('Teste de Responsividade Navegação Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });   

    await loginCompletomobile(page);    
    
    menumobile(); 

    const dashboardBtn = page.getByText(/dashboard/i).first();
    await expect(dashboardBtn).toBeVisible({ timeout: 5000 });
    await dashboardBtn.click();
    console.log('CLICOU EM DASKBOARD');      

    menumobile()
        
    await page.waitForTimeout(1000);
    await page.getByText(/pessoas/i).click({ force: true }); 
    console.log('CLICOU EM PESSOAS');

    menumobile()

    await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForURL(/producto/, { timeout: 15000 }),
      page.locator('a[href*="producto"]').first().click()
    ]);
    console.log('CLICOU EM PRODUTOS');

    menumobile()    

    await page.waitForTimeout(1000);
    await page.getByText(/vendas/i).click({ force: true });
    console.log('CLICOU EM VENDAS');

    await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForURL(/facturacion/, { timeout: 15000 }),
      page.locator('a[href*="facturacion"]').first().click()
    ]);
    console.log('CLICOU EM FATURAMENTO');

    await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForURL(/dav/, { timeout: 15000 }),
      page.locator('a[href*="dav"]').first().click()
    ]);
    console.log('CLICOU EM DAV');

    menumobile()

    await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForURL(/lotes/, { timeout: 15000 }),
      page.locator('a[href*="lotes"]').first().click()
    ]);
    console.log('CLICOU EM LOTES'); 

    menumobile()

    const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
    await expect(usuariosBtn).toBeVisible({ timeout: 5000 });
    await usuariosBtn.click();
    console.log('CLICOU EM USUÁRIOS');

    menumobile()

    await page.waitForTimeout(1000);
    page.locator('a[href*="usuario/listado"]').click()
    console.log('CLICOU EM LISTAGEM DE USUARIOS');

    menumobile()

    await page.waitForTimeout(1000);
    page.locator('a[href*="usuario/perfil"]').click()
    console.log('CLICOU EM PERFIL DE ACESSO');

    menumobile()

    const comprasBtn = page.getByText(/compras/i).first();
    await expect(comprasBtn).toBeVisible({ timeout: 5000 });
    await comprasBtn.click();
    console.log('CLICOU EM COMPRAS');

    await page.waitForTimeout(1000);
    page.locator('a[href*="compras/listagem"]').click()
    console.log('CLICOU EM LISTAGEM DE COMPRAS'); 

    await page.waitForTimeout(1000);
    await page.getByText(/cadastros/i).click({ force: true }); 
    console.log('CLICOU EM CADASTROS');

    menumobile()    

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/metodos-pagos"]').click()
    console.log('CLICOU EM ESPÉCIES');     

    /*menumobile()

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/cotizacion-monedas"]').click()
    console.log('CLICOU EM COTAÇÃO');*/

    menumobile()

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/grupos"]').click()
    console.log('CLICOU EM GRUPOS');

    menumobile()

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/subgrupos"]').click()
    console.log('CLICOU EM SUBGRUPOS');        

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/marcas"]').click()
    console.log('CLICOU EM MARCAS');  
    
     menumobile()
    

    await page.waitForTimeout(1000);
    await page.getByText(/funcionários/i).click({ force: true });
    console.log('CLICOU EM FUNCIONÁRIOS');         

    await capturarRequisicoesApi(page) 
        
    function  menumobile() {
      const menuHamburguer = page.getByLabel(/menu/i); // ou ajuste conforme o seletor real
      expect(menuHamburguer).toBeVisible({ timeout: 5000 });
      menuHamburguer.click();      
    }

  async function capturarRequisicoesApi(page: Page) {  
   console.log(`***REQUISIÇÕES DA API ⬅️***`);
   const requisicoes: any[] = [];

  page.on('request', request => {
    requisicoes.push({ metodo: request.method(), url: request.url() });
    console.log(`➡️ Requisição: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', async response => {
    const status = response.status();
    console.log(`⬅️ Resposta: [${status}] ${response.url()}`);    
  });

  // aguarda um tempo para verificar se houve requisições
  await page.waitForTimeout(3000);

  if (requisicoes.length === 0) {
    console.log('⚠️ NENHUMA REQUISIÇÃO CAPTURADA!');
  }
}

});