import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de busca crítico em Cotação de Moedas', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);
  
    await page.waitForTimeout(1000);
    const cadBtn = page.getByText(/cadastros/i).first();
    await expect(cadBtn).toBeVisible();
    await cadBtn.click();
    console.log('CLICOU EM CADASTRO');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/cotizacion-monedas"]').click()
    console.log('CLICOU EM COTAÇÃO');

    await page.waitForTimeout(1000);    
    const codigos = await page.locator('table td span[class*="tw-text-ellipsis"][class*="tw-text-nowrap"]').allTextContents();

    if (codigos.length > 0) {  
        const codigoEscolhido = codigos[0].trim();
        await page.getByLabel(/pesquisar registro/i).fill(codigoEscolhido);
        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);
        console.log('BUSCA COTAÇÃO EXISTENTE OK:', codigoEscolhido);
    } else {
        console.warn('Nenhum código encontrado na grade.');
    }
    
    await page.waitForTimeout(1000);   
    const moedainex = '003';
    await page.getByLabel(/pesquisar registro/i).fill(moedainex);
    await page.waitForTimeout(1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
    console.log('BUSCA COTAÇÃO INEXISTENTE OK:', moedainex);

    await page.waitForTimeout(4000);  
});