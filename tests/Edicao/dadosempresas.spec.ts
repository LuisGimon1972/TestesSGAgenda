import { test } from '@playwright/test';

test('Teste de Dados Cadastro de DAV', async ({ page }) => {    
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => {
  document.body.style.zoom = '0.5';});
  console.log('🔍 Zoom ajustado para 50% via CSS');

  console.log('INICIO');
  await page.goto(process.env.BASE_URL!);
  console.log('ABRIU SITE');
  await page.getByText(/entrar/i).click();
  console.log('CLICOU EM ENTRAR');
  
  await page.waitForSelector('input[type="email"], input[type="text"]', {
    timeout: 15000
  });
  await page.waitForTimeout(1000);
  console.log('FORM LOGIN APARECEU');  
  await page.locator('input[type="email"], input[type="text"]').first().fill(process.env.USER!);
  await page.locator('input[type="password"]').first().fill(process.env.PASS!);
  await page.waitForTimeout(1000);
  console.log('PREENCHIDO');  
  await page.getByRole('button', { name: /sign in|entrar/i }).click();
  console.log('CLICOU EM SIGN LN');
  
  await page.waitForURL(/empresas/, { timeout: 20000 });
  console.log('CHEGOU EM EMPRESAS'); 
  
  const campoPesquisa = page.getByPlaceholder('PESQUISAR EMPRESAS');
  await campoPesquisa.fill('NEW');
  await page.keyboard.press('Enter');
  console.log('PESQUISOU EMPRESA');
  
  const botao = page.locator('button:has-text("ENTRAR")').nth(0);  
  await botao.highlight();
  await botao.evaluate((el: any) => {
    el.style.border = '5px solid red';
    el.click();
  });
  console.log('CLICOU EM ACESSAR EMPRESA');
   
   
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  const dataISO = `${dia}-${mes}-${ano}`;  
  await page.getByLabel(/data de fundação/i).fill(dataISO);
  console.log('DATA DE FUNDAÇÃO OK:', dataISO);
  await page.waitForTimeout(3000);

  await page.emulateMedia({ media: 'screen' });
    await page.evaluate(() => {
      document.body.style.zoom = '0.6';
    });
    console.log('🔍 Zoom ajustado para 60% via CSS');

  await page.locator('.q-field')
    .filter({ hasText: /departamento/i })
    .first()
    .click({ force: true });
    const menuDepartamento = page.locator('.q-menu').last();
    await menuDepartamento.waitFor();
    await menuDepartamento
    .locator('.q-item')
    .filter({ hasText: /alto paraná|alto parana/i })
    .click({ force: true });
    const dep = await page.locator('input[aria-label="Departamento"]').inputValue();      
    console.log('DEPARTAMENTO OK:',dep);

    await page.locator('.q-field')
    .filter({ hasText: /distrito/i })
    .first()
    .click({ force: true });
    const menuDistrito = page.locator('.q-menu').last();
    await menuDistrito.waitFor();
    await menuDistrito
    .locator('.q-item')
    .filter({ hasText: /ciudad/i })
    .click({ force: true });
    const distrito = await page.locator('input[aria-label="Distrito"]').inputValue();      
    console.log('DISTRITO OK:',distrito);

    await page.locator('.q-field')
    .filter({ hasText: /cidade/i })
    .first()
    .click({ force: true });
    const menuCiudad = page.locator('.q-menu').last();
    await menuCiudad.waitFor();
    await menuCiudad
    .locator('.q-item')
    .filter({ hasText: /2A/i })
    .click({ force: true });
    const city = await page.locator('input[aria-label="Cidade/Bairro"]').inputValue();      
    console.log('CIUDAD OK:',city);

    const direccion = `TEST DIRECCION ${Date.now()}`;
    await page.getByLabel(/direção/i).fill(direccion);
    console.log('DIRECCIÓN OK:', direccion);    

    const numero = Math.floor(Math.random() * 1000) + 1;
    const campoNumero = page.locator('.q-field')
    .filter({ hasText: /número/i })
    .last();
    await campoNumero.locator('input').fill(numero.toString());
    console.log('NUMERO OK:', numero.toString().trim());

    const campoWrapper = page.locator('.q-select:has([aria-label="Código de atividade econômica"])');
    await campoWrapper.waitFor({ state: 'visible' });    
    await campoWrapper.scrollIntoViewIfNeeded();    
    await campoWrapper.click({ force: true });
    const menu = page.locator('.q-menu');
    await menu.waitFor({ state: 'visible' });    
    await menu.locator('.q-item').first().click();    
    const valorSelecionado = await page.locator('input[aria-label="Código de atividade econômica"]').inputValue();
    console.log('Código selecionado:', valorSelecionado);

     await page.locator('.q-btn')
    .filter({ hasText: /salvar|guardar/i })
    .click({ force: true });
  console.log('CLICOU EM SALVAR USUARIO');

  console.log('URL:', await page.url()); 

  
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
  console.log('MODAL + OVERLAY REMOVIDOS');

  

});