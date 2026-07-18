import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Edição de datos marcas', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);    
 
    const cadBtn = page.getByText(/cadastros/i).first();
    await expect(cadBtn).toBeVisible();
    await cadBtn.click();
    console.log('CLICOU EM CADASTRO');

    await page.waitForTimeout(1000);
    await page.locator('a[href*="registros/marcas"]').click();
    console.log('CLICOU EM MARCAS'); 

    const getMarcaPromise = page.waitForResponse((response) =>
        response.url().includes('/api/marca') &&
        response.request().method() === 'GET' &&
        response.status() === 200 &&
        response.url().includes('page=')
    );

    await page.waitForSelector('table');    
    await page.waitForTimeout(1000);
    await page.locator('.q-skeleton').first().waitFor({ state: 'detached', timeout: 10000 });    
    await page.waitForTimeout(1000);
  
    const getMarcaResponseOriginal = await getMarcaPromise;
    const dadosAntes = await getMarcaResponseOriginal.json();
    const headersOriginais = getMarcaResponseOriginal.request().headers();    

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

    const marcaId =
        primeiroRegistro?.id ??
        primeiroRegistro?.codigo ??
        primeiroRegistro?.uuid ??
        primeiroRegistro?.controle;

    if (!marcaId) {
        console.log('PRIMEIRO REGISTRO ENCONTRADO:', JSON.stringify(primeiroRegistro, null, 2));
        throw new Error('Não foi possível obter o ID da marca para consulta.');
    }

    const baseUrl = new URL(getMarcaResponseOriginal.url()).origin;
    const urlRegistroSpecific = `${baseUrl}/api/marca/${marcaId}`;
    
    const headersGetRegistro: Record<string, string> = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(headersOriginais.authorization && { authorization: headersOriginais.authorization }),
        ...(headersOriginais['x-xsrf-token'] && { 'x-xsrf-token': headersOriginais['x-xsrf-token'] }),
        ...(headersOriginais['x-tenant'] && { 'x-tenant': headersOriginais['x-tenant'] }),
        ...(headersOriginais['x-empresa'] && { 'x-empresa': headersOriginais['x-empresa'] }),
    };
    
    console.log(`CONSULTANDO REGISTRO ANTES DA ALTERAÇÃO (ID: ${marcaId})...`);
    const getAntesResponse = await page.request.get(urlRegistroSpecific, { headers: headersGetRegistro });
    
    console.log(`STATUS GET REGISTRO ANTES: ${getAntesResponse.status()}`);
    if (getAntesResponse.ok()) {
        const dadosRegistroAntes = await getAntesResponse.json();
        console.log('*** DADOS DO REGISTRO NO BANCO (ANTES DA ALTERAÇÃO) ***');
        console.log(JSON.stringify(dadosRegistroAntes, null, 2));
    } else {
        console.log(`Não foi possível consultar o registro individual antes. Status: ${getAntesResponse.status()}`);
    }

    await page.waitForTimeout(2000);
    await page.locator('table img[src="/icons/edit.svg"]').first().click();
    console.log('CLICOU NO ÍCONE DE EDITAR');

    console.log('ID DO REGISTRO EDITADO:', marcaId);
    console.log('URL DO REGISTRO EDITADO:', urlRegistroSpecific);    

    await page.waitForTimeout(2000);
    console.log('***DADOS ENVIADOS PRA API***');  
    await page.waitForTimeout(2000);
    const marca = `TEST MARCA ALTERADA ${Date.now()}`;
    await page.getByLabel(/editar marca/i).fill(marca);
    console.log('NOME DE MARCA ALTERADA OK:', marca);           
    console.log('***FIM DE DADOS ENVIADOS***');  

    const salvarMarcaPromise = page.waitForResponse((response) =>
        response.url().includes('/api/marca') &&
        ['PUT', 'PATCH', 'POST'].includes(response.request().method()) &&
        response.status() >= 200 &&
        response.status() < 300
    );

    await page.locator('.q-btn')
        .filter({ hasText: /confirmar|guardar/i })
        .click({ force: true });
    console.log('CLICOU EM SALVAR MARCA');  
    await salvarMarcaPromise;

    const getMarcaResponse = await page.request.get(urlRegistroSpecific, {
        headers: headersGetRegistro,
    });

    console.log(`STATUS GET REGISTRO EDITADO: ${String(getMarcaResponse.status())}`);

    const textoResposta = await getMarcaResponse.text();

    if (!getMarcaResponse.ok()) {
        throw new Error(`GET registro editado falhou: ${getMarcaResponse.status()} - ${textoResposta}`);
    }

    const dadosDepois = JSON.parse(textoResposta);

    console.log('***DADOS APÓS A ALTERAÇÃO (GET DO REGISTRO EDITADO)***');
    console.log(JSON.stringify(dadosDepois, null, 2));

    expect(JSON.stringify(dadosDepois)).toContain(marca);       

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);      
});