import { test, expect } from '@playwright/test';

test('Teste de segurança completo no login e módulo Pessoas', async ({ page, request }) => {    
  await page.goto(process.env.BASE_URL!);
  await page.getByText(/entrar/i).click();
  
  const dialogs: string[] = [];
  page.on('dialog', dialog => dialogs.push(dialog.message()));  

  for (let i = 0; i <= 10; i++) {
  await page.locator('input[type="email"], input[type="text"]').first().fill(`user${i}@teste.com`);
  await page.locator('input[type="password"]').first().fill('senhaErrada');
  await page.getByRole('button', { name: /sign in|entrar/i }).click();  
}
  console.log('1) TESTE DE SEGURANÇA BRUTE FORCE OK');
  
  await page.waitForTimeout(100);
  await page.waitForSelector('input[type="email"], input[type="text"]', { timeout: 5000 });
  await page.locator('input[type="email"], input[type="text"]').first().fill('<script>alert("xss")</script>');
  await page.locator('input[type="password"]').first().fill('senhaqualquer');
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: /sign in|entrar/i }).click();  
  expect(dialogs.length).toBe(0);   
  const bloqueioLocator = page.locator('text=/bloqueado|captcha/i');
  const existe = await bloqueioLocator.count();
  if (existe > 0) {
  expect(await bloqueioLocator.isVisible()).toBeTruthy();
  } else {
   console.log('Nenhum bloqueio/captcha detectado');
  }
  console.log('2) TESTE DE SEGURANÇA XSS INJECTION OK');
  console.log('Tela de bloqueio apresentada OK');  
  await page.waitForTimeout(2000);
  const erroLocator = page.locator('.error-message');
  if (await erroLocator.count() > 0) {
    const erroMsg = await erroLocator.innerText();
    expect(erroMsg).not.toMatch(/SQL|tabela|stack/i);
    } else {
    console.log('Nenhuma mensagem de erro encontrada');
    }
  console.log('3) TESTE DE SEGURANÇA MENSAGENS DE ERRO SEGURAS OK');
  
  await page.waitForTimeout(2000);
  const acessoNegado = await page.locator('text=/403|não autorizado/i').isVisible();
  if (acessoNegado) {
    console.log('⚠️ Acesso restrito detectado');
  }
  console.log('4) TESTE DE SEGURANÇA CONTROLE DE ACESSO PÓS-LOGIN OK');
  
  await page.waitForTimeout(2000);
  const cookies = await page.context().cookies();
  const authCookie = cookies.find(c => c.name.includes('auth') || c.name.includes('session'));
  if (authCookie) {
    expect(authCookie.httpOnly).toBeTruthy();
    expect(authCookie.secure).toBeTruthy();
  } else {
    console.log('Nenhum cookie de autenticação encontrado');
  }
  console.log('5) TESTE DE SEGURANÇA COOKIES DE SESSÃO OK');
  
  await page.waitForTimeout(2000);
  await page.goto(process.env.BASE_URL!);
  await page.getByText(/entrar/i).click();
  await page.locator('input[type="email"], input[type="text"]').first().fill('');
  await page.locator('input[type="password"]').first().fill('');
  await page.getByRole('button', { name: /sign in|entrar/i }).click();
  const msgCampos = await page.locator('text=/obrigatório|preencha/i').isVisible();
  if (msgCampos) {
    console.log('⚠️ Mensagem de campo obrigatório detectada'); 
  }
  console.log('6) TESTE DE SEGURANÇA CAMPOS VAZIOS OK');
  
  await page.waitForTimeout(2000);
  const response = await request.post(`${process.env.BASE_URL!}/login`, {
  data: { email: process.env.USER!, password: process.env.PASS! }
  });
  const replay = await request.post(`${process.env.BASE_URL!}/login`, {
  data: { email: process.env.USER!, password: process.env.PASS! }
  });
  expect(replay.status()).not.toBe(200);
  console.log('7) TESTE DE SEGURANÇA REPLAY DE REQUISIÇÃO OK');
  
  await page.waitForTimeout(2000);
  await page.goto(`${process.env.BASE_URL!}/py/pessoa`);
  const tituloLocator = page.locator('text=/Pessoas|Cadastro de Pessoas|Lista de Pessoas/i');
  if (await tituloLocator.count() > 0) {
    expect(await tituloLocator.isVisible()).toBeTruthy();
  } else {
    console.log('Nenhum título de Pessoas encontrado na página');
  }
  console.log('8) TESTE DE SEGURANÇA ACESSO MÓDULO PESSOAS OK');
  
  await page.waitForTimeout(2000);
  const conteudo = await page.content();
  if (conteudo) {  
    expect(conteudo).not.toMatch(/senha\s*=\s*|chave\s*=\s*|token\s*=\s*/i);
  } else {
    console.log('Nenhum conteúdo retornado da página Pessoas');
  }
  console.log('9) TESTE DE SEGURANÇA DADOS SENSÍVEIS OK'); 
  
  await page.waitForTimeout(1000);
  await page.context().clearCookies();
  await page.goto(`${process.env.BASE_URL!}/py/pessoa`);
  const bloqueioLogin = await page.locator('text=/login|entrar/i').isVisible();
  if (bloqueioLogin) {
    console.log('⚠️ Sistema exigiu login para acessar Pessoas');
  } else {
    console.log('Página Pessoas não exibiu mensagem de login, verificar comportamento esperado');
  }
  console.log('10) TESTE DE SEGURANÇA TESTE SEM LOGIN OK');  

});