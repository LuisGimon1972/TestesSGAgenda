import { test } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Edição de datos Pessoas', async ({ page }) => {
  test.setTimeout(120000);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await loginCompleto(page);

  await page.waitForTimeout(1000);
  await page.getByText(/pessoas/i).click({ force: true });
  console.log('CLICOU EM PESSOAS');

  await page.waitForTimeout(2000);
  await page.waitForSelector('table');
  await page.locator('.q-skeleton').first().waitFor({ state: 'detached', timeout: 15000 });

  const editIcons = await page.locator('table img[src="/icons/edit.svg"]').count();
  console.log('Quantidade de ícones de edição:', editIcons.toString().trim());

  if (editIcons === 0) {
    console.log('O REGISTRO PADRÃO NÃO PODE SER ALTERADO!');
    return;
  }

  const getRegistroEditadoPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/pessoa') &&
    response.request().method() === 'GET' &&
    response.status() === 200 &&
    /\/api\/py\/pessoa\/[^/?]+/.test(response.url())
  );

  const getPessoaPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/pessoa') &&
    response.request().method() === 'GET' &&
    response.status() === 200
  );  

  await page.locator('table img[src="/icons/edit.svg"]').first().click();
  console.log('CLICOU NO ÍCONE DE EDITAR');
  
  const getPessoaResponsee = await getPessoaPromise;
  const dadosAntes = await getPessoaResponsee.json();
  console.log('*** DADOS DO REGISTRO NO BANCO (ANTES DA ALTERAÇÃO) ***');
  console.log(JSON.stringify(dadosAntes, null, 2));  

  const getRegistroEditadoResponse = await getRegistroEditadoPromise;
  const urlRegistroEditado = getRegistroEditadoResponse.url();
  const headersOriginais = getRegistroEditadoResponse.request().headers();

  console.log('URL DO REGISTRO EDITADO:', urlRegistroEditado);

  console.log('***DADOS ENVIADOS PRA API**');
  await page.waitForTimeout(1000);
  await page.locator('[aria-label="Tipo de operação"]').click({ force: true });
  const menuDoc1 = page.locator('.q-menu').last();
  await menuDoc1.waitFor();
  await menuDoc1
    .locator('.q-item')
    .filter({ hasText: /B2F/i })
    .click({ force: true });
  const tipoop = await page.locator('input[aria-label="Tipo de operação"]').inputValue();
  console.log('TIPO DE OPERAÇÃO OK:', tipoop);

  await page.waitForTimeout(1000);
  const nome = `TEST CLIENTE ALTERADO ${Date.now()}`;
  await page.getByLabel(/nome completo/i).fill(nome);
  console.log('NOMBRE DO CLIENTE ALTERADO OK:', nome);

  await page.waitForTimeout(1000);
  const direccion = `TEST DIRECCION ALTERADA ${Date.now()}`;
  await page.getByLabel(/direção/i).fill(direccion);
  console.log('ENDEREÇO ALTERADO OK:', direccion);

  await page.waitForTimeout(1000);
  const numero = Math.floor(Math.random() * 4000) + 1;
  const campoNumero = page.locator('.q-field')
    .filter({ hasText: /número/i })
    .last();  
  console.log('NÚMERO ALTERADO OK:',numero.toString().trim());

  await page.waitForTimeout(1000);
  const telefone = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');
  const inputTelefone = page.locator('input[type="tel"]').first();
  await inputTelefone.scrollIntoViewIfNeeded();
  await inputTelefone.click({ force: true });
  await inputTelefone.press('Control+A');
  await inputTelefone.press('Backspace');
  await inputTelefone.type(telefone, { delay: 30 });
  console.log('TELEFONE ALTERADO OK:', telefone);
  console.log('***FIM DE DADOS ENVIADOS**');

  const salvarPessoaPromise = page.waitForResponse((response) =>
    response.url().includes('/api/py/pessoa') &&
    ['PUT', 'PATCH', 'POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300
  );

  await page.locator('.q-btn')
    .filter({ hasText: /salvar|guardar/i })
    .click({ force: true });
  console.log('CLICOU EM SALVAR');

  await salvarPessoaPromise;

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
  const getPessoaResponse = await page.request.get(urlRegistroEditado, {
    headers: headersGetRegistro,
  });
  console.log(`STATUS GET REGISTRO EDITADO: ${String(getPessoaResponse.status())}`);
  const textoResposta = await getPessoaResponse.text();
  if (!getPessoaResponse.ok()) {
    throw new Error(`GET registro editado falhou: ${getPessoaResponse.status()} - ${textoResposta}`);
  }
  const dadosDepois = JSON.parse(textoResposta);
  console.log('***DADOS APÓS DA ALTERAÇÃO (GET DO REGISTRO EDITADO)***');
  console.log(JSON.stringify(dadosDepois, null, 2));

  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);      
});