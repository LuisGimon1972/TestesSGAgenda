import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Edição de datos espécies', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });    
    await loginCompleto(page);    
 
    await page.waitForTimeout(1000);
    await page.getByText(/cadastros/i).click({ force: true }); 
    console.log('CLICOU EM CADASTROS');

    await page.waitForTimeout(1000);
    page.locator('a[href*="registros/metodos-pagos"]').click()
    console.log('CLICOU EM ESPÉCIES'); 
    
    await page.waitForSelector('table');    
    await page.waitForTimeout(1000);
    await page.locator('.q-skeleton').first().waitFor({ state: 'detached', timeout: 10000 });  
    await page.waitForTimeout(1000);  
    const trashIcons = await page.locator('table img[src*="trash"]').count();    
    console.log('QUANTIDADE DE REGISTROS NA GRADE:', trashIcons.toString().trim());

    if (trashIcons > 0) {    
        
        const getRegistroEditadoPromise = page.waitForResponse((response) =>
        response.url().includes('/api/especie') &&
        response.request().method() === 'GET' &&
        response.status() === 200 &&
        /\/api\/especie\/[^/?]+/.test(response.url()));
        
        const getEspeciePromise = page.waitForResponse((response) =>
        response.url().includes('/api/especie') &&
        response.request().method() === 'GET' &&
        response.status() === 200);

        await page.locator('table img[src="/icons/edit.svg"]').first().click();
        console.log('CLICOU NO ÍCONE DE EDITAR');  
        
        const getEspecieResponsee = await getEspeciePromise;
        const dadosAntes = await getEspecieResponsee.json();
        console.log('*** DADOS DO REGISTRO NO BANCO (ANTES DA ALTERAÇÃO) ***');
        console.log(JSON.stringify(dadosAntes, null, 2));        

        const getRegistroEditadoResponse = await getRegistroEditadoPromise;
        const urlRegistroEditado = getRegistroEditadoResponse.url();
        const headersOriginais = getRegistroEditadoResponse.request().headers();

        console.log('URL DO REGISTRO EDITADO:', urlRegistroEditado);
        
        console.log('***DADOS ENVIADOS PRA API***');

        await page.waitForTimeout(1000);
        const descricao = `TEST ESPÉCIE ALTERADA ${Date.now()}`;
        await page.getByLabel(/descrição/i).fill(descricao);
        console.log('DESCRIÇÃO DE ESPÉCIE ALTERADA OK:', descricao);

        await page.locator('[aria-label="Tipo do cartão"]').click({ force: true });
        const cartao = page.locator('.q-menu:visible');
        await cartao.waitFor();
        await cartao
        .locator('.q-item')
        .filter({ hasText: /não é cartão|débito|crédito/i })
        .first()
        .click({ force: true });
        const tipocar = await page.locator('input[aria-label="Tipo do cartão"]').inputValue();      
        console.log('TIPO DO CARTÃO OK:',tipocar);

        await page.waitForTimeout(1000);
        const moedaField = page.locator('[aria-label="Moeda de cotação (diferente da sua empresa)"]').first();
        await moedaField.scrollIntoViewIfNeeded();
        await expect(moedaField).toBeVisible();    
        await moedaField.evaluate(el => (el as HTMLElement).click());    
        const menu1= page.locator('.q-menu');
        await expect(menu1).toBeVisible();    
        const moedas = ['usd', 'brl', 'pyg', 'cad', 'eur', 'gbp'];    
        const moedaEscolhida = moedas[Math.floor(Math.random() * moedas.length)];
        const opcao = menu1.locator('.q-item', {
        hasText: new RegExp(moedaEscolhida, 'i')
        }).first();
        await opcao.click();
        console.log('MOEDA DE COTAÇÃO ALTERADA OK:', moedaEscolhida);

        await page.waitForTimeout(1000);
        await page.locator('[aria-label="Tipo da espécie"]').click({ force: true });
        const menu = page.locator('.q-menu:visible');
        await menu.waitFor();
        await menu
        .locator('.q-item')
        .filter({ hasText: /dinheiro/i })
        .first()
        .click({ force: true });
        const tipoesp = await page.locator('input[aria-label="Tipo da espécie"]').inputValue();      
        console.log('TIPO DA ESPÉCIE ALTERADA OK:',tipoesp);
        console.log('***FIM DE DADOS ENVIADOS***');

        const salvarEspeciePromise = page.waitForResponse((response) =>
        response.url().includes('/api/especie') &&
        ['PUT', 'PATCH', 'POST'].includes(response.request().method()) &&
        response.status() >= 200 &&
        response.status() < 300);

        await page.locator('.q-btn')
        .filter({ hasText: /salvar|guardar/i })
        .click({ force: true });
        console.log('CLICOU EM SALVAR');  

        await salvarEspeciePromise;

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
        const getEspecieResponse = await page.request.get(urlRegistroEditado, {
            headers: headersGetRegistro,
        });
        console.log(`STATUS GET REGISTRO EDITADO: ${String(getEspecieResponse.status())}`);
        const textoResposta = await getEspecieResponse.text();
        if (!getEspecieResponse.ok()) {
            throw new Error(`GET registro editado falhou: ${getEspecieResponse.status()} - ${textoResposta}`);
        }
        const dadosDepois = JSON.parse(textoResposta);
        console.log('***DADOS APÓS DA ALTERAÇÃO (GET DO REGISTRO EDITADO)***');
        console.log(JSON.stringify(dadosDepois, null, 2));        
    }
    else{
        console.log('NENHUM REGISTRO ENCONTRADO NA GRADE, NADA PARA EDITAR.');  
    }

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});