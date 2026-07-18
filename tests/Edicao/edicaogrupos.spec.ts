import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Edição de dados grupos', async ({ page }) => {
  test.setTimeout(120000);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await loginCompleto(page);

  const cadBtn = page.getByText(/cadastros/i).first();
  await expect(cadBtn).toBeVisible();
  await cadBtn.click();
  console.log('CLICOU EM CADASTRO');

  await page.locator('a[href*="registros/grupos"]').click();
  console.log('CLICOU EM GRUPOS');
  
  const getGrupoPromise = page.waitForResponse((response) =>
    response.url().includes('/api/produto/grupo') &&
    response.request().method() === 'GET' &&
    response.status() === 200 &&
    response.url().includes('page=')
  );
 
  await page.waitForSelector('table');
  await page.locator('.q-skeleton').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

  const getGrupoResponseOriginal = await getGrupoPromise;
  const dadosAntes = await getGrupoResponseOriginal.json();
  const headersOriginais = getGrupoResponseOriginal.request().headers();

  await page.waitForTimeout(2000);    

  const editIcons = await page.locator('table img[src="/icons/edit.svg"]').count();
  console.log('QUANTIDADE DE REGISTROS NA GRADE:', editIcons.toString().trim());

  if (editIcons === 0) {
    console.log('NENHUM ÍCONE DE EDIÇÃO ENCONTRADO NA GRADE, NADA PARA EDITAR.');
    return;
  }  
  
  const primeiroRegistro =
    dadosAntes.data?.data?.[0] ??
    dadosAntes.data?.[0] ??
    dadosAntes.rows?.[0] ??
    dadosAntes.items?.[0] ??
    dadosAntes.result?.[0] ??
    dadosAntes[0];

  const grupoId =
    primeiroRegistro?.id ??
    primeiroRegistro?.codigo ??
    primeiroRegistro?.uuid ??
    primeiroRegistro?.controle;

  if (!grupoId) {
    console.log('PRIMEIRO REGISTRO ENCONTRADO:', JSON.stringify(primeiroRegistro, null, 2));
    throw new Error('Não foi possível obter o ID do grupo para consulta.');
  }

  const baseUrl = new URL(getGrupoResponseOriginal.url()).origin;
  const urlRegistroSpecific = `${baseUrl}/api/produto/grupo/${grupoId}`;
  
  const headersGetRegistro: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(headersOriginais.authorization && { authorization: headersOriginais.authorization }),
    ...(headersOriginais['x-xsrf-token'] && { 'x-xsrf-token': headersOriginais['x-xsrf-token'] }),
    ...(headersOriginais['x-tenant'] && { 'x-tenant': headersOriginais['x-tenant'] }),
    ...(headersOriginais['x-empresa'] && { 'x-empresa': headersOriginais['x-empresa'] }),
  };
  
  console.log(`CONSULTANDO REGISTRO ANTES DA ALTERAÇÃO (ID: ${grupoId})...`);
  const getAntesResponse = await page.request.get(urlRegistroSpecific, { headers: headersGetRegistro });
  
  console.log(`STATUS GET REGISTRO ANTES: ${getAntesResponse.status()}`);
  if (getAntesResponse.ok()) {
    const dadosRegistroAntes = await getAntesResponse.json();
    console.log('*** DADOS DO REGISTRO NO BANCO (ANTES DA ALTERAÇÃO) ***');
    console.log(JSON.stringify(dadosRegistroAntes, null, 2));
  } else {
    console.log(`Não foi possível consultar o registro individual. Status: ${getAntesResponse.status()}`);
  }
  
  await page.locator('table img[src="/icons/edit.svg"]').first().click();
  console.log('CLICOU NO ÍCONE DE EDITAR');
  await page.waitForTimeout(2000);

  console.log('*** DADOS ENVIADOS PRA API ***');
  const nomegrupo = `TEST GRUPO ALTERADO ${Date.now()}`;
  await page.getByLabel(/editar grupo/i).fill(nomegrupo);
  console.log('NOME DE GRUPO ALTERADO OK:', nomegrupo);

  const salvarGrupoPromise = page.waitForResponse((response) =>
    response.url().includes('/api/produto/grupo') &&
    ['PUT', 'PATCH', 'POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300
  );

  await page.locator('.q-btn')
    .filter({ hasText: /confirmar|guardar/i })
    .click({ force: true });

  console.log('CLICOU EM SALVAR GRUPO');
  await salvarGrupoPromise;
  
  const getDepoisResponse = await page.request.get(urlRegistroSpecific, { headers: headersGetRegistro });
  console.log(`STATUS GET REGISTRO EDITADO: ${getDepoisResponse.status()}`);

  const textoResposta = await getDepoisResponse.text();
  if (!getDepoisResponse.ok()) {
    throw new Error(`GET registro editado falhou: ${getDepoisResponse.status()} - ${textoResposta}`);
  }

  const dadosDepois = JSON.parse(textoResposta);
  console.log('*** DADOS APÓS A ALTERAÇÃO (GET DO REGISTRO EDITADO) ***');
  console.log(JSON.stringify(dadosDepois, null, 2));
  
  expect(JSON.stringify(dadosDepois)).toContain(nomegrupo);

  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);    
});