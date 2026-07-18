import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { capturarRequisicaoApiCadastro } from '../../utils/capturaApipayload';

test('Cadastro de produtos/serviços', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const inicioLogin = Date.now();
      await loginCompleto(page);    
      const fimLogin = Date.now();

      const inicio = Date.now();

      await page.waitForTimeout(1000);
      await Promise.all([
      page.waitForURL(/producto/, { timeout: 15000 }),
      page.locator('a[href*="producto"]').first().click()
      ]);
      console.log('CLICOU PRODUTOS');

      const btnCadastrar = page.getByText(/cadastrar produto|serviço/i).first();
      await btnCadastrar.waitFor();
      await btnCadastrar.click({ force: true });
      console.log('CLICOU CADASTRAR');

      await page.emulateMedia({ media: 'screen' });
      await page.evaluate(() => {
      document.body.style.zoom = '0.7'; });
      console.log('🔍 Zoom ajustado para 70% via CSS');

      console.log('***DADOS ENVIADOS PRA API***');

      const nomeproduto = `TEST PRODUTO DESEMPENHO ${Date.now()}`;
      await page.getByLabel(/nome/i).fill(nomeproduto);
      console.log('NOME DE PRODUTO OK:', nomeproduto);

      const btnGerar = page.getByText(/gerar/i).first();
      await btnGerar.waitFor();
      await btnGerar.click({ force: true });
      console.log('CLICOU GERAR CÓDIGO DE BARRAS');

      const localestoque = `TEST LOCAL ESTOQUE ${Date.now()}`;
      await page.getByLabel(/localização/i).fill(localestoque);
      console.log('LOCALIZAÇÃO DE ESTOQUE OK', localestoque);

      const refestoque = `TEST REFERÊNCIA ESTOQUE ${Date.now()}`;
      await page.getByLabel(/referência/i).fill(refestoque);
      console.log('REFERÊNCIA ESTOQUE ESTOQUE OK', refestoque);

      await page.locator('input[aria-label="Fornecedor"]').focus();      
      await page.keyboard.press('ArrowDown');      
      await page.waitForSelector('.q-menu:visible');      
      await page.locator('.q-menu:visible .q-item')
      .filter({ hasText: /REGISTRO\s+ESTÁNDAR/i })
      .click();      
      const fornecedor = await page.locator('input[aria-label="Fornecedor"]').inputValue();
      console.log('FORNECEDOR OK:', fornecedor);  

      const precusto = Math.floor(Math.random() * 1000) + 1;
      const campoPrecusto = page.locator('.q-field')
      .filter({ hasText: /preço de custo/i })
      .last();
      await campoPrecusto.locator('input').fill(precusto.toString());
      console.log('PREÇO DE CUSTO OK:', precusto.toFixed(0));

      const campoLucro = page.locator('.q-field')
      .filter({ hasText: /% lucro/i })
      .last();
      const perLucro = await campoLucro.locator('input').inputValue();
      console.log('% DE LUCRO OK:', perLucro);

      const campoPrevenda = page.locator('.q-field')
      .filter({ hasText: /preço de venda/i })
      .last();
      const valorPrevenda = await campoPrevenda.locator('input').inputValue();
      console.log('PREÇO DE VENDA OK:', valorPrevenda);      

      const cantidad = Math.floor(Math.random() * 1000) + 1;
      const campocantidad = page.locator('.q-field')
      .filter({ hasText: /quantidade/i })
      .first();
      await campocantidad.locator('input').fill(cantidad.toString());
      console.log('QUANTIDADE OK:', cantidad.toString());

      const cantidadmin = Math.floor(Math.random() * 100) + 1;
      const campoCantidadMin = page
      .locator('.q-field')
      .filter({ hasText: /quantidade mínima/i })
      .last();
      const input = campoCantidadMin.locator('input');
      await expect(input).toBeVisible();
      await input.fill(String(cantidadmin));
      console.log('QUANTIDADE MÍNIMA OK:', cantidadmin.toString());

      const cantidadmax = Math.floor(Math.random() * 1000) + 1;
      const campoCantidadmax = page
      .locator('.q-field')
      .filter({ hasText: /quantidade máxima/i })
      .last();
      const input2 = campoCantidadmax.locator('input');
      await expect(input).toBeVisible();
      await input2.fill(String(cantidadmax));
      console.log('QUANTIDADE MÁXIMA OK:', cantidadmax.toString());

      const ivaField = page.locator('[aria-label="IVA"]').first();
      await ivaField.scrollIntoViewIfNeeded();
      await expect(ivaField).toBeVisible();
      await ivaField.evaluate(el => (el as HTMLElement).click());
      const menuIva = page.locator('.q-menu');
      await expect(menuIva).toBeVisible();
      await menuIva
      .locator('.q-item')
      .filter({ hasText: /10%|isento/i })
      .first()
      .click();
      console.log('IVA OK');
      
      const obsproduto = `TEST OBSERVAÇÕES DE PRODUTOS PRODUTO REVISADO E APROVADO DE MUITA BOA QUALIDADE ${Date.now()}`;
      await page.locator('textarea.q-field__native').fill(obsproduto);
      console.log('OBSERVAÇÕES OK:', obsproduto);
      await expect(page.locator('textarea.q-field__native')).toHaveValue(obsproduto);

      await page.locator('.q-btn')
      .filter({ hasText: /salvar|guardar/i })
      .click({ force: true });
      console.log('CLICOU EM SALVAR');  

      await capturarRequisicaoApiCadastro(page, '/api/py/produto'); 
      
      await capturarRequisicoesApi(page);       

      const tempoLogin = fimLogin - inicioLogin;
      console.log(`⏱️Tempo total do Login: ${tempoLogin} ms`);

      const fim = Date.now();
      const tempoTotal = fim - inicio;
      console.log(`⏱️Tempo total do Cadastro: ${tempoTotal} ms`);      
      if (tempoTotal > 8000) {
         console.log('⚠️ Tempo acima do limite esperado [8000 ms]');
      }else {
        console.log(`✅ Tempo do cadastro dentro do limite[8000 ms]: ${tempoTotal} ms`);
      }

      const totalGeral = tempoLogin + tempoTotal;
      console.log(`⏱️Tempo total Módulo: ${totalGeral} ms`);
});