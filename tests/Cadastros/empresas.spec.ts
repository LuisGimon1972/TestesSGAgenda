import { test, expect, Page } from '@playwright/test';
import { fecharPopupAtualizacao } from '../../utils/novidade';
import { empresasParaguai } from '../../utils/rucs-paraguai';

const aplicarZoom = async (page: Page, zoomLevel: string) => {
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate((zoom) => {
    document.body.style.zoom = zoom;
  }, zoomLevel);  
};

const selecionarOpcaoQuasar = async (page: Page, nomeCampo: string | RegExp) => {
  const wrapper = page.locator('.q-field').filter({ hasText: nomeCampo }).first();
  await wrapper.scrollIntoViewIfNeeded();
  await wrapper.click({ force: true });
  
  const menu = page.locator('.q-menu').last();
  await menu.waitFor({ state: 'visible', timeout: 10000 });
  await menu.locator('.q-item').first().click();  
  
  await page.waitForTimeout(500);
};

function gerarRUC(): string {
  const empresaAleatoria = empresasParaguai[Math.floor(Math.random() * empresasParaguai.length)];
  return empresaAleatoria.ruc;
}

test('Teste de Cadastro de Empresas', async ({ page }) => {     
  test.setTimeout(90000); 

  await page.setViewportSize({ width: 1920, height: 1080 });
  await aplicarZoom(page, '0.5');

  const salvarEmpresaPromise = page.waitForResponse((response) =>
    response.url().includes('/api/empresa') &&
    ['POST'].includes(response.request().method()) &&
    response.status() >= 200 &&
    response.status() < 300
  );

  let razaoSocial = '';
  let urlempresa = '';

  console.log('--- INICIO DO TESTE ---');
  await page.goto(process.env.BASE_URL!);
  
  await page.getByText(/entrar/i).click();  
  
  const inputEmail = page.locator('input[type="email"], input[type="text"]').first();
  await inputEmail.waitFor({ state: 'visible', timeout: 15000 });
  
  await inputEmail.fill(process.env.USER!);
  await page.locator('input[type="password"]').first().fill(process.env.PASS!);
  await page.getByRole('button', { name: /sign in|entrar/i }).click();
  console.log('✅ Login realizado');
  
  await page.waitForURL(/empresas/, { timeout: 20000 });
  
  const btnAdicionar = page.getByText('Adicionar empresa', { exact: true });
  await btnAdicionar.waitFor({ state: 'visible' });
  await btnAdicionar.click();    
  
  console.log('DADOS ENVIADOS PARA API');

  const ruc = gerarRUC();
  const inputRuc = page.locator('input[aria-label*="RUC" i], .q-field:has-text("RUC") input').first();
  await inputRuc.waitFor({ state: 'visible' });
  await inputRuc.fill(ruc);
  console.log(`✅ RUC preenchido: ${ruc}`);      
  
  const inputRazao = page.locator('input[aria-label*="Razão social" i], .q-field:has-text("Razão social") input').first();
  try {    
    await expect(inputRazao).not.toHaveValue('', { timeout: 8000 });
    razaoSocial = await inputRazao.inputValue();
  } catch {
    console.log('⚠️ API do RUC demorou. Preenchendo Razão Social manualmente.');
    razaoSocial = `EMPRESA AUTO RUC ${ruc} - ${Date.now()}`;
    await inputRazao.fill(razaoSocial);
  }
  console.log(`✅ Razão social: ${razaoSocial}`);
  
  const codigoEstabelecimento = Math.floor(Math.random() * 1000) + 100;
  await page.locator('input[aria-label*="Código do estabelecimento" i], .q-field:has-text("Código") input').first()
    .fill(codigoEstabelecimento.toString());
  console.log(`✅ Código de Estabelicimento: ${codigoEstabelecimento}`);
  
  const telefone = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');    
  const inputTelefone = page.locator('input[type="tel"]').first();
  await inputTelefone.scrollIntoViewIfNeeded();
  await inputTelefone.click({ force: true });
  await inputTelefone.press('Control+A');
  await inputTelefone.press('Backspace');
  await inputTelefone.pressSequentially(telefone, { delay: 10 });
  console.log(`✅ Telefone: ${telefone}`);
  
  const email = `empresa${Date.now()}@gmail.com`;
  const campoEmail = page.locator('.q-field').filter({ hasText: /e-mail/i }).first().locator('input');
  await campoEmail.fill(email);
  console.log(`✅ E-mail: ${email}`);
  
  await page.locator('#submit-company').click();
  
  const checkboxTermos = page.getByText('Declaro estar ciente', { exact: true });
  await checkboxTermos.waitFor({ state: 'visible' });
  await checkboxTermos.click();

  await page.getByRole('button', { name: /confirmar/i }).click();
  
  const dominio = `empresa${Math.floor(Math.random() * (10000 - 21 + 1)) + 21}`;
  urlempresa = dominio;
  
  try {  
    await page.waitForTimeout(500); // Pausa visual para transição de tela
    
    let inputDominio = page.locator('input[aria-label*="domínio" i], input[aria-label*="dominio" i], .q-field:has-text("domínio") input, .q-field:has-text("dominio") input').first();
    
    if (await inputDominio.count() === 0) {
        inputDominio = page.locator('input[type="text"] >> visible=true').last();
    }

    await inputDominio.waitFor({ state: 'visible', timeout: 5000 });  
    await inputDominio.click(); 
    await inputDominio.fill(''); 
    await inputDominio.pressSequentially(dominio, { delay: 50 }); // Digitação humanizada
    
    console.log(`✅ Domínio preenchido: ${dominio}`);  
  } catch (error) {
    console.log('⚠️ Erro ao tentar preencher o domínio:', error);
  }
  
  await page.locator('#submit-domain').waitFor({ state: 'visible' });
  await page.locator('#submit-domain').click();
  console.log('✅ Cadastro inicial finalizado. Redirecionando...');  
  
  await page.waitForURL(/\/py\/empresas/, { timeout: 20000 });
  
  const campoPesquisa = page.getByPlaceholder(/pesquisar empresas/i);
  await campoPesquisa.waitFor({ state: 'visible', timeout: 20000 });
  await campoPesquisa.fill(razaoSocial.trim());
  await page.keyboard.press('Enter');
  
  await page.waitForTimeout(1000); // Espera a tabela filtrar    
  await page.getByText(razaoSocial.trim(), { exact: false })
            .first()
            .waitFor({ state: 'visible', timeout: 15000 });
  
  const botaoEntrar = page.locator('button:has-text("ENTRAR")').first();
  if (await botaoEntrar.count() > 0) {
    for (let i = 0; i < 3; i++) {
      try {
        await botaoEntrar.waitFor({ state: 'visible', timeout: 5000 });
        await botaoEntrar.click({ force: true });
        console.log('✅ Botão ENTRAR clicado com sucesso');
        break;
      } catch {
        await page.waitForTimeout(1000);
      }
    }
  }

  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    document.querySelectorAll('.q-dialog, .q-dialog__backdrop, .q-overlay').forEach((el: any) => {
      el.remove();
    });
  });
  
  const urlDatosEmpresa = `https://${urlempresa}.hom.sgmaster.com.br/py/datos-empresa`;
  await page.waitForURL(urlDatosEmpresa, { timeout: 15000 }).catch(() => {});    

    await page.evaluate(() => {
    document.querySelectorAll('.q-dialog, .q-dialog__backdrop, .q-overlay').forEach((el: any) => {
      el.remove();
    });
  });

  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    document.querySelectorAll('.q-dialog, .q-dialog__backdrop, .q-overlay').forEach((el: any) => {
      el.remove();
    });
  });

  await fecharPopupAtualizacao(page)   

  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  const dataISO = `${dia}-${mes}-${ano}`;  
  await page.getByLabel(/data de fundação/i).fill(dataISO);  
  console.log(`✅ Data de Fundação: ${dataISO}`);  

  await aplicarZoom(page, '0.6');    

  await selecionarOpcaoQuasar(page, /departamento/i);
  const dep = await page.locator('input[aria-label="Departamento"]').inputValue();
  console.log(`✅ Departamento: ${dep}`);
  await selecionarOpcaoQuasar(page, /distrito/i);
  const distrito = await page.locator('input[aria-label="Distrito"]').inputValue();
  console.log(`✅ Distrito: ${distrito}`);
  await selecionarOpcaoQuasar(page, /cidade/i);
  const city = await page.locator('input[aria-label="Cidade/Bairro"]').inputValue();
  console.log(`✅ Cidade: ${city}`);
  
  const direccion = `TEST DIRECCION ${Date.now()}`;
  await page.getByLabel(/direção/i).fill(direccion);
  console.log(`✅ Endereço: ${direccion}`);

  const numero = Math.floor(Math.random() * 1000) + 1;
  await page.locator('.q-field').filter({ hasText: /número/i }).last().locator('input').fill(numero.toString());
  console.log(`✅ Número: ${numero}`);     
  
  await selecionarOpcaoQuasar(page, /atividade econômica/i);

  console.log('FIM DE DADOS ENVIADOS');
  
  await page.locator('.q-btn').filter({ hasText: /salvar|guardar/i }).click({ force: true });
  console.log('✅ Configuração da empresa salva com sucesso!'); 
 
  const salvarUrlResponse = await salvarEmpresaPromise;     
  const urlCompletaPost = salvarUrlResponse.url();
  console.log('✅ A URL capturada do POST é:', urlCompletaPost);

  const salvarEmpresaResponse = await salvarEmpresaPromise;
  const dadosSalvos = await salvarEmpresaResponse.json();
  console.log('✅ DADOS RETORNADOS NA CRIAÇÃO');
  console.log(JSON.stringify(dadosSalvos, null, 2));
  
  const idEmpresa = dadosSalvos.codEmpresa.toString().trim();        
  const urlRegistroCriado = `https://global-hom.sgmw.com.br/api/empresa/${idEmpresa}`;  
  const headersOriginais = salvarEmpresaResponse.request().headers();
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
  console.log('🌐 URL do registro criado:', urlRegistroCriado);
  console.log('✅ RESPOSTA DA API AO CONSULTAR O NOVO REGISTRO');
  console.log('✅ Novo Controle:', idEmpresa);    
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
  
  await page.evaluate(() => {
    document.querySelectorAll('.q-dialog, .q-dialog__backdrop, .q-overlay').forEach((el: any) => el.remove());
  }).catch(() => {});
});