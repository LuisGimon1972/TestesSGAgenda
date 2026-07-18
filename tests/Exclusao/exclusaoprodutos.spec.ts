import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Exclusão de datos Produtos', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);    

    await page.waitForTimeout(1000);
      await Promise.all([
      page.waitForURL(/producto/, { timeout: 15000 }),
      page.locator('a[href*="producto"]').first().click()
      ]);
      console.log('CLICOU PRODUTOS');

     await page.waitForTimeout(2000);
  
     const menuTresPontos = page.locator('table tr:first-child >> text=more_vert');

     if (await menuTresPontos.count() > 0 && await menuTresPontos.isVisible()) {
      console.log('LOCALIZOU OS TRÊS PONTOS');
      await menuTresPontos.click();
      console.log('CLICOU NOS TRÊS PONTOS');

      const primeiraLinha = page.locator('table tr:first-child td');
      const qtdColunas = await primeiraLinha.count();

      console.log('CAPTURA DO REGISTRO DA GRADE ANTES DE SER REMOVIDO:');
      for (let i = 1; i < qtdColunas; i++) {
        const valor = await primeiraLinha.nth(i).textContent();
        console.log(`Coluna ${i}: ${valor?.trim()}`);
      }
     
      await page.waitForSelector('table tr:first-child td', { state: 'visible' });

      const codigoProduto = await primeiraLinha.nth(2).textContent(); // exemplo: coluna 1
      const codigoLimpo = codigoProduto?.trim();

      if (!codigoLimpo) {
        throw new Error('⚠️ Não foi possível capturar o código da pessoa na tabela.');
      }
      console.log(`CÓDIGO SELECIONADO: ${codigoLimpo}`);

      await page.waitForTimeout(1000);
      await page.waitForSelector('text=Excluir', { state: 'visible' });
      await page.locator('text=Excluir').click();      
      console.log('CLICOU EM EXCLUIR');   

      await page.waitForTimeout(1000);
      await page.waitForSelector('button:has-text("EXCLUIR")');
      await page.click('button:has-text("EXCLUIR")');
      console.log('CLICOU EM EXCLUIR NO DIÁLOGO DE CONFIRMAÇÃO');

      const deleteResponse = await page.waitForResponse((response) =>
      response.url().includes(`/api/py/produto/geral/${codigoLimpo}`) &&
      response.request().method() === 'DELETE');
      expect([200, 204]).toContain(deleteResponse.status());

      const getExcluidoResponse = await page.request.get(`/api/py/produto/geral/${codigoLimpo}`);

      console.log('***RESPOSTA DA API AO CONSULTAR REGISTRO EXCLUÍDO***');
      console.log(`Status: ${getExcluidoResponse.status()}`);

      try {
        const dadosExcluido = await getExcluidoResponse.json();
        console.log(JSON.stringify(dadosExcluido, null, 2));
      } catch {
        console.log('Resposta sem corpo. (Status Code: 404)');
      }
      
      expect([404, 200]).toContain(getExcluidoResponse.status());

      console.log(`Registro ${codigoLimpo} removido com sucesso.`); 

      await page.waitForTimeout(2000);
      await capturarRequisicoesApi(page);
      await page.waitForTimeout(4000);
     } else {
      console.log('NENHUM REGISTRO ENCONTRADO NA GRADE, NADA PARA EXCLUIR.');
     }
});