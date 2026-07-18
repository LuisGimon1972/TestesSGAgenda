import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { obterProdutoAleatorio } from '../../utils/listaprodutos';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Cadastro de produtos/serviços', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await loginCompleto(page);      
      
      await page.waitForTimeout(2000);       
    
      const salvarProdutoPromise = page.waitForResponse((response) =>
      response.url().includes('/api/py/produto') &&
      ['POST'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300);                     

      await page.waitForTimeout(1000);
      await Promise.all([
      page.waitForURL(/producto/, { timeout: 15000 }),
      page.locator('a[href*="producto"]').first().click()
      ]);
      console.log('✅ Clicou em Produtos');
      console.log('✅ Apareceu Grade de Produtos');

      const btnCadastrar = page.getByText(/cadastrar produto|serviço/i).first();
      await btnCadastrar.waitFor();
      await btnCadastrar.click({ force: true });
      console.log('✅ Clicou em Cadastrar Produto');
      console.log(`✅ Abriu Form de Produtos`);      

      await page.emulateMedia({ media: 'screen' });
      await page.evaluate(() => {
      document.body.style.zoom = '0.7'; });      

      console.log('DADOS ENVIADOS PRA API');
      
      const nomeproduto = obterProdutoAleatorio();
      await page.getByLabel(/nome/i).fill(nomeproduto.nome);
      console.log('✅ Nome de Produto:', nomeproduto.nome.toUpperCase());

      const btnGerar = page.getByText(/gerar/i).first();
      await btnGerar.waitFor();
      await btnGerar.click({ force: true });
      console.log('✅ Clicou em Gerar Código de Barras');

      await page.waitForTimeout(2000);      
      const codigoBarras = await page.locator('input[aria-label="Código de barras interno"]').inputValue();      
      console.log(`✅ Código de barras interno gerado: ${codigoBarras}`);

      const localestoque = obterProdutoAleatorio();
      await page.getByLabel(/localização/i).fill(localestoque.categoria);
      console.log('✅ Localização de Estoque:', localestoque.categoria.toUpperCase());

      const refestoque = obterProdutoAleatorio()
      await page.getByLabel(/referência/i).fill(refestoque.id);
      console.log('✅ Referência de Estoque:', refestoque.id);      

      await page.locator('input[aria-label="Fornecedor"]').focus();      
      await page.keyboard.press('ArrowDown');      
      await page.waitForSelector('.q-menu:visible');      
      await page.locator('.q-menu:visible .q-item')
      .filter({ hasText: /REGISTRO\s+ESTÁNDAR/i })
      .click();      
      const fornecedor = await page.locator('input[aria-label="Fornecedor"]').inputValue();
      console.log('✅ Nome do Fornecedor:', fornecedor);      
      
      const uso = await page.locator('input[aria-label="Tipo de uso"]').inputValue();      
      console.log('✅ Tipo de Uso:', uso);
      
      const unid = await page.locator('input[aria-label="Unidade de medida"]').inputValue();      
      console.log('✅ Unidades:', unid);

      await page.waitForTimeout(2000);

      const precusto = Math.floor(Math.random() * 1000) + 1;
      const campoPrecusto = page.locator('.q-field')
      .filter({ hasText: /preço de custo/i })
      .last();
      await campoPrecusto.locator('input').fill(precusto.toString());
      console.log('✅ Preço de Custo:', precusto.toFixed(0));

      const campoLucro = page.locator('.q-field')
      .filter({ hasText: /% lucro/i })
      .last();
      const perLucro = await campoLucro.locator('input').inputValue();
      console.log('✅ % de Lucro:', perLucro);
      
      const campoPrevenda = page.locator('.q-field')
      .filter({ hasText: /preço de venda/i })
      .last();
      const valorPrevenda = await campoPrevenda.locator('input').inputValue();
      console.log('✅ Preço de Venda:', valorPrevenda);

      const cantidad = Math.floor(Math.random() * 1000) + 1;
      const campocantidad = page.locator('.q-field')
      .filter({ hasText: /quantidade/i })
      .first();
      await campocantidad.locator('input').fill(cantidad.toString());
      console.log('✅ Quantidade:', cantidad.toString());

      const cantidadmin = Math.floor(Math.random() * 100) + 1;
      const campoCantidadMin = page
      .locator('.q-field')
      .filter({ hasText: /quantidade mínima/i })
      .last();
      const input = campoCantidadMin.locator('input');
      await expect(input).toBeVisible();
      await input.fill(String(cantidadmin));
      console.log('✅ Quantidade Mínima:', cantidadmin.toString());

      const cantidadmax = Math.floor(Math.random() * 1000) + 1;
      const campoCantidadmax = page
      .locator('.q-field')
      .filter({ hasText: /quantidade máxima/i })
      .last();
      const input2 = campoCantidadmax.locator('input');
      await expect(input).toBeVisible();
      await input2.fill(String(cantidadmax));
      console.log('✅Quantidade Máxima:', cantidadmax.toString());           

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
      const iva = await page.locator('input[aria-label="IVA"]').inputValue();      
      console.log('✅ IVA:',iva);   
      
      await page.waitForTimeout(2000);
      const obsproduto = `TEST OBSERVAÇÕES DE PRODUTOS PRODUTO REVISADO E APROVADO DE MUITA BOA QUALIDADE ${Date.now()}`;
      await page.locator('textarea.q-field__native').fill(obsproduto);
      console.log('✅ Observações:', obsproduto);
      await expect(page.locator('textarea.q-field__native')).toHaveValue(obsproduto);
      console.log('FIM DE DADOS ENVIADOS');

      await page.locator('.q-btn')
      .filter({ hasText: /salvar|guardar/i })
      .click({ force: true });
      console.log('✅ Clicou em Salvar');  

      const salvarUrlResponse = await salvarProdutoPromise;     
      const urlCompletaPost = salvarUrlResponse.url();
      console.log('🌐 A URL capturada do POST é:', urlCompletaPost);

      const salvarPessoaResponse = await salvarProdutoPromise;
      const dadosSalvos = await salvarPessoaResponse.json();
      console.log('✅ DADOS RETORNADOS NA CRIAÇÃO');
      console.log(JSON.stringify(dadosSalvos, null, 2));
      
      const idProduto = dadosSalvos.produto.controle.toString().trim();      
      //const urlRegistroCriado = `https://testepyeduardo.global-hom.sgmw.com.br/api/py/produto/${idProduto}`;    
      const urlRegistroCriado = urlCompletaPost.replace('/geral', `/${idProduto}`);
      const headersOriginais = salvarPessoaResponse.request().headers();
      const headersGetRegistro: Record<string, string> = {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            authorization: headersOriginais['authorization'],
            'x-xsrf-token': headersOriginais['x-xsrf-token'],
            'x-tenant': headersOriginais['x-tenant'],
            'x-empresa': headersOriginais['x-empresa'],
      };
      
      const getCriadoResponse = await page.request.get(urlRegistroCriado, {
            headers: headersGetRegistro,
      });
      console.log('🌐 A URL do registro criado é:', urlRegistroCriado);
      console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO');
      console.log('✅ Novo Controle:', idProduto);    
      console.log(`✅ Status: ${getCriadoResponse.status()}`);

      try {
            const dadosCriado = await getCriadoResponse.json();
            console.log(JSON.stringify(dadosCriado, null, 2));
      } catch (error) {
            console.error('Erro ao converter resposta para JSON:', error);
            const corpoBruto = await getCriadoResponse.text();
            console.log('Corpo bruto da resposta:', corpoBruto);
      }

      expect([404, 200]).toContain(getCriadoResponse.status());             
     // await capturarRequisicoesApi(page); 
     // await page.waitForTimeout(4000);
});