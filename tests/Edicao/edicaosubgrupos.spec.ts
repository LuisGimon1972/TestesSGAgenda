import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Edição de dados subgrupos', async ({ page }) => {
  test.setTimeout(120000);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await loginCompleto(page);
  
  await page.getByText(/cadastros/i).first().click();
  console.log('CLICOU EM CADASTRO');

  await page.locator('a[href*="registros/subgrupos"]').click();
  console.log('CLICOU EM SUBGRUPOS');  
 
  const getSubgrupoPromise = page.waitForResponse((response) =>
    response.url().includes('/api/produto/subgrupo') &&
    response.request().method() === 'GET' &&
    response.status() === 200 &&
    response.url().includes('page=')
  );

  await page.waitForSelector('table tbody tr');
  await page.locator('.q-skeleton').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});

  const getSubgrupoResponseOriginal = await getSubgrupoPromise;
  const dadosAntes = await getSubgrupoResponseOriginal.json();
  const headersOriginais = getSubgrupoResponseOriginal.request().headers(); 
  
  const editIcons = await page.locator('img[src*="edit.svg"]').count();
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

  const subgrupoId =
    primeiroRegistro?.id ??
    primeiroRegistro?.codigo ??
    primeiroRegistro?.uuid ??
    primeiroRegistro?.controle;

  if (!subgrupoId) {
    console.log('PRIMEIRO REGISTRO ENCONTRADO:', JSON.stringify(primeiroRegistro, null, 2));
    throw new Error('Não foi possível obter o ID do subgrupo para consulta.');
  }

  const baseUrl = new URL(getSubgrupoResponseOriginal.url()).origin;
  const urlRegistroSpecific = `${baseUrl}/api/produto/subgrupo/${subgrupoId}`;
  
  const headersGetRegistro: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(headersOriginais.authorization && { authorization: headersOriginais.authorization }),
    ...(headersOriginais['x-xsrf-token'] && { 'x-xsrf-token': headersOriginais['x-xsrf-token'] }),
    ...(headersOriginais['x-tenant'] && { 'x-tenant': headersOriginais['x-tenant'] }),
    ...(headersOriginais['x-empresa'] && { 'x-empresa': headersOriginais['x-empresa'] }),
  };
  
  console.log(`CONSULTANDO REGISTRO ANTES DA ALTERAÇÃO (ID: ${subgrupoId})...`);
  const getAntesResponse = await page.request.get(urlRegistroSpecific, { headers: headersGetRegistro });
  
  console.log(`STATUS GET REGISTRO ANTES: ${getAntesResponse.status()}`);
  if (getAntesResponse.ok()) {
    const dadosRegistroAntes = await getAntesResponse.json();
    console.log('*** DADOS DO REGISTRO NO BANCO (ANTES DA ALTERAÇÃO) ***');
    console.log(JSON.stringify(dadosRegistroAntes, null, 2));
  } else {
    console.log(`Não foi possível consultar o registro individual antes. Status: ${getAntesResponse.status()}`);
  }
  
  await page.locator('img[src*="edit.svg"]').first().click();
  console.log('CLICOU NO ÍCONE DE EDITAR');
  
  console.log('*** DADOS ENVIADOS PRA API ***');
  await page.waitForTimeout(2000);    
  const nomesubgrupo = `TEST SUBGRUPO ALTERADO ${Date.now()}`;
  await page.getByLabel(/editar subgrupo/i).fill(nomesubgrupo);
  console.log('NOME DE SUBGRUPO ALTERADO OK:', nomesubgrupo);
  await page.waitForTimeout(2000);    
  console.log('*** FIM DE DADOS ENVIADOS ***');
  
  const salvarSubgrupoPromise = page.waitForResponse((response) =>
    response.url().includes('/api/produto/subgrupo') &&
    ['PUT', 'PATCH', 'POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300
  );

  await page.locator('.q-btn').filter({ hasText: /confirmar|guardar/i }).click({ force: true });
  console.log('CLICOU EM SALVAR SUBGRUPO');

  await salvarSubgrupoPromise;  
  
  const getDepoisResponse = await page.request.get(urlRegistroSpecific, { headers: headersGetRegistro });
  console.log(`STATUS GET REGISTRO EDITADO: ${getDepoisResponse.status()}`);

  const textoResposta = await getDepoisResponse.text();
  if (!getDepoisResponse.ok()) {
    throw new Error(`GET registro editado falhou: ${getDepoisResponse.status()} - ${textoResposta}`);
  }

  const dadosDepois = JSON.parse(textoResposta);
  console.log('*** DADOS APÓS A ALTERAÇÃO (GET DO REGISTRO EDITADO) ***');
  console.log(JSON.stringify(dadosDepois, null, 2));

  expect(JSON.stringify(dadosDepois)).toContain(nomesubgrupo);

  await capturarRequisicoesApi(page);
  await page.waitForTimeout(4000);
});