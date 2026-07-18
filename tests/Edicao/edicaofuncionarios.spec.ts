import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Edição de datos funcionários', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);
  
  await page.getByText(/funcionários/i).click({ force: true });
  console.log('CLICOU EM FUNCIONÁRIOS');  

  await page.waitForSelector('table');
  await page.locator('.q-skeleton').first().waitFor({ state: 'detached', timeout: 15000 });
  await page.waitForSelector('table img[src*="edit"], table svg', { timeout: 15000 });
  const editIcons = await page.locator('table img[src*="edit"], table svg').count();  
  console.log('QUANTIDADE DE REGISTROS NA GRADE:', editIcons.toString().trim());

  if (editIcons > 0) {          
       
      const getRegistroEditadoPromise = page.waitForResponse((response) =>
      response.url().includes('/api/py/funcionario') &&
      response.request().method() === 'GET' &&
      response.status() === 200 &&
      /\/api\/py\/funcionario\/[^/?]+/.test(response.url())
      );

      const getFuncionarioPromise = page.waitForResponse((response) =>
      response.url().includes('/api/py/funcionario') &&
      response.request().method() === 'GET' &&
      response.status() === 200
      );

      await page.locator('table img[src="/icons/edit.svg"]').first().click();
      console.log('CLICOU NO ÍCONE DE EDITAR');    

      const getFuncionarioResponsee = await getFuncionarioPromise;
      const dadosAntes = await getFuncionarioResponsee.json();
      console.log('*** DADOS DO REGISTRO NO BANCO (ANTES DA ALTERAÇÃO) ***');
      console.log(JSON.stringify(dadosAntes, null, 2));      

      const getRegistroEditadoResponse = await getRegistroEditadoPromise;
      const urlRegistroEditado = getRegistroEditadoResponse.url();
      const headersOriginais = getRegistroEditadoResponse.request().headers();

      console.log('URL DO REGISTRO EDITADO:', urlRegistroEditado);

      console.log('***DADOS ENVIADOS PRA API***');

      const nomefuncionario = `TEST FUNCIONARIO ALTERADO ${Date.now()}`;
      const camponomefuncionario = page
      .locator('.q-field')
      .filter({ hasText: /funcionário/i })
      .first()
      .locator('input');
      await expect(camponomefuncionario).toBeVisible();
      await camponomefuncionario.fill(nomefuncionario);
      console.log('NOME FUNCIONÁRIO ALTERADO OK:', nomefuncionario);

      const cargofuncionario = `TEST CARGO ${Date.now()}`;
      const campocargofuncionario = page
      .locator('.q-field')
      .filter({ hasText: /cargo/i })
      .last()
      .locator('input');
      await expect(campocargofuncionario).toBeVisible();
      await campocargofuncionario.fill(cargofuncionario);
      console.log('CARGO FUNCIONÁRIO ALTERADO OK:', cargofuncionario);   

      const tipdoc = await page.locator('input[aria-label="Tipo de documento"]').inputValue();      
      console.log('TIPO DE DOCUMENTO OK:', tipdoc); 
      console.log('***FIM DE DADOS ENVIADOS***');

      const salvarFuncionarioPromise = page.waitForResponse((response) =>
      response.url().includes('/api/py/funcionario') &&
      ['PUT', 'PATCH', 'POST'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
      );
      
      await page.locator('.q-btn')
      .filter({ hasText: /salvar|guardar/i })
      .click({ force: true });
      console.log('CLICOU EM SALVAR USUARIO');

      await salvarFuncionarioPromise;

      const headersGetRegistro: Record<string, string> = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      };
      if (headersOriginais.authorization) {
        headersGetRegistro.authorization = headersOriginais.authorization;
      }
      if (headersOriginais['x-xsrf-token']) {
        headersGetRegistro['x-xsrf-token'] = headersOriginais['x-xsrf-token'];
      }
      if (headersOriginais['x-tenant']) {
        headersGetRegistro['x-tenant'] = headersOriginais['x-tenant'];
      }
      if (headersOriginais['x-empresa']) {
        headersGetRegistro['x-empresa'] = headersOriginais['x-empresa'];
      }
      const getFuncionarioResponse = await page.request.get(urlRegistroEditado, {
        headers: headersGetRegistro,
      });
      console.log(`STATUS GET REGISTRO EDITADO: ${String(getFuncionarioResponse.status())}`);
      const textoResposta = await getFuncionarioResponse.text();
      if (!getFuncionarioResponse.ok()) {
        throw new Error(`GET registro editado falhou: ${getFuncionarioResponse.status()} - ${textoResposta}`);
      }
      const dadosDepois = JSON.parse(textoResposta);
      console.log('***DADOS APÓS DA ALTERAÇÃO (GET DO REGISTRO EDITADO)***');
      console.log(JSON.stringify(dadosDepois, null, 2));      
  }
  else  {
      console.log('NENHUM REGISTRO ENCONTRADO NA GRADE, NADA PARA EDITAR.');  
  }
  
  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);  
});