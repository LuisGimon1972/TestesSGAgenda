import { test, expect } from '@playwright/test';
import { loginCompletomobile } from '../../utils/logincompletomobile';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Teste de Responsividade Navegação Tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await loginCompletomobile(page);      
    
    const dashboardBtn = page.getByText(/dashboard/i).first();
    await expect(dashboardBtn).toBeVisible({ timeout: 5000 });
    await dashboardBtn.click();
    console.log('CLICOU EM DASKBOARD');          
        
    await page.waitForTimeout(1000);
    await page.getByText(/pessoas/i).click({ force: true }); 
    console.log('CLICOU EM PESSOAS');    

    await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForURL(/producto/, { timeout: 15000 }),
      page.locator('a[href*="producto"]').first().click()
    ]);
    console.log('CLICOU EM PRODUTOS');        

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

    await page.waitForTimeout(1000);
    await Promise.all([
      page.waitForURL(/lotes/, { timeout: 15000 }),
      page.locator('a[href*="lotes"]').first().click()
    ]);
    console.log('CLICOU EM LOTES'); 

    const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
    await expect(usuariosBtn).toBeVisible({ timeout: 5000 });
    await usuariosBtn.click();
    console.log('CLICOU EM USUÁRIOS');

    await page.waitForTimeout(1000);
    page.locator('a[href*="usuario/listado"]').click()
    console.log('CLICOU EM LISTAGEM DE USUARIOS');

    await page.waitForTimeout(1000);
    page.locator('a[href*="usuario/perfil"]').click()
    console.log('CLICOU EM PERFIL DE ACESSO');

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

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/metodos-pagos"]').click()
    console.log('CLICOU EM ESPÉCIES');  

  /*  await page.waitForTimeout(1000);
    page.locator('a[href*="registros/cotizacion-monedas"]').click()
    console.log('CLICOU EM COTAÇÃO');*/

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/grupos"]').click()
    console.log('CLICOU EM GRUPOS');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/subgrupos"]').click()
    console.log('CLICOU EM SUBGRUPOS');    

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/marcas"]').click()
    console.log('CLICOU EM MARCAS');     

    await page.waitForTimeout(1000);
    await page.getByText(/funcionários/i).click({ force: true });
    console.log('CLICOU EM FUNCIONÁRIOS');         

    await capturarRequisicoesApi(page);                
});