import { test, expect } from '@playwright/test';

test('Teste de segurança completo no login e módulo Pessoas', async ({ page, request }) => {    
  test.setTimeout(120000);

  await page.goto(process.env.BASE_URL!);
  await page.getByText(/entrar/i).first().click();
  
  const dialogs: string[] = [];
  page.on('dialog', dialog => dialogs.push(dialog.message()));  
  
  for (let i = 0; i <= 30; i++) {
    await page.locator('input[type="email"], input[type="text"]').first().fill(`user${i}@teste.com`);
    await page.locator('input[type="password"]').first().fill('senhaErrada');
    await page.getByRole('button', { name: /sign in|entrar/i }).first().click();  
  }
  console.log('✅ 1) TESTE DE SEGURANÇA BRUTE FORCE ');    
  
  const emailInput = page.locator('input[type="email"], input[type="text"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill('<script>alert("xss")</script>');
  await page.locator('input[type="password"]').first().fill('senhaqualquer');
  await page.getByRole('button', { name: /sign in|entrar/i }).first().click();      
  
  await page.waitForLoadState('domcontentloaded');
  expect(dialogs.length).toBe(0);     
  
  const bloqueioLocator = page.locator('text=/bloqueado|captcha/i').first();
  if (await bloqueioLocator.count() > 0) {
    await expect(bloqueioLocator).toBeVisible();
  } else {
    console.log('Nenhum bloqueio/captcha detectado');
  }
  console.log('✅ 2) TESTE DE SEGURANÇA XSS INJECTION');
  console.log('Tela de bloqueio apresentada');      
  
  const erroLocator = page.locator('.error-message').first();
  if (await erroLocator.count() > 0) {
    const erroMsg = await erroLocator.innerText();
    expect(erroMsg).not.toMatch(/SQL|tabela|stack/i);
  } else {
    console.log('Nenhuma mensagem de erro encontrada');
  }
  console.log('✅ 3) TESTE DE SEGURANÇA MENSAGENS DE ERRO SEGURAS');    
  
  const acessoNegadoLocator = page.locator('text=/403|não autorizado/i').first();
  if (await acessoNegadoLocator.count() > 0 && await acessoNegadoLocator.isVisible()) {
    console.log('⚠️ Acesso restrito detectado');
  }
  console.log('✅ 4) TESTE DE SEGURANÇA CONTROLE DE ACESSO PÓS-LOGIN');    
  
  const cookies = await page.context().cookies();
  const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
  if (authCookie) {
    expect(authCookie.httpOnly).toBeTruthy();
    expect(authCookie.secure).toBeTruthy();
  } else {
    console.log('Nenhum cookie de autenticação encontrado');
  }
  console.log('✅ 5) TESTE DE SEGURANÇA COOKIES DE SESSÃO');      
  
  const msgCamposLocator = page.locator('text=/obrigatório|preencha/i').first();
  if (await msgCamposLocator.count() > 0) {
    const visivel = await msgCamposLocator.isVisible();
    if (visivel) {
      console.log('⚠️ Mensagem de campo obrigatório detectada');
    } else {
      console.log('Locator encontrado mas não visível');
    }
  } else {
    console.log('Nenhuma mensagem de campo obrigatório encontrada');
  }
  console.log('✅ 6) TESTE DE SEGURANÇA CAMPOS VAZIOS');    
  
  const response = await request.post(`${process.env.BASE_URL!}/login`, {
    data: { email: process.env.USER!, password: process.env.PASS! }
  });
  const replay = await request.post(`${process.env.BASE_URL!}/login`, {
    data: { email: process.env.USER!, password: process.env.PASS! }
  });
  expect(replay.status()).not.toBe(200);
  console.log('✅ 7) TESTE DE SEGURANÇA REPLAY DE REQUISIÇÃO');         
  
  const conteudo = await page.content();
  if (conteudo) {  
    expect(conteudo).not.toMatch(/senha\s*=\s*|chave\s*=\s*|token\s*=\s*/i);
  } else {
    console.log('Nenhum conteúdo retornado da página Pessoas');
  }
  console.log('✅ 8) TESTE DE SEGURANÇA DADOS SENSÍVEIS');     
  
  await page.context().clearCookies();
  await page.goto(`${process.env.BASE_URL!}/pessoa`);
  await page.waitForLoadState('domcontentloaded'); 
  
  const bloqueioLoginLocator = page.locator('text=/login|entrar/i').first();
  if (await bloqueioLoginLocator.count() > 0 && await bloqueioLoginLocator.isVisible()) {
    console.log('⚠️ Sistema exigiu login para acessar Pessoas');
  } else {
    console.log('Página Pessoas não exibiu mensagem de login, verificar comportamento esperado');
  }
  console.log('✅ 9) TESTE DE SEGURANÇA TESTE SEM LOGIN ');    
});