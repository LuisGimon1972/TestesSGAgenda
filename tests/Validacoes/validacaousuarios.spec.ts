import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Validação de usuários', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);
  
  const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
  await expect(usuariosBtn).toBeVisible();
  await usuariosBtn.click();
  console.log('CLICOU EM USUÁRIOS');

  const listado = page.locator('a[href*="usuario/listado"]');
  await expect(listado).toBeVisible();
  await listado.click();
  console.log('CLICOU EM LISTAGEM DE USUARIOS');
  
  const btnCadastrar = page.getByText(/cadastrar usuário/i).first();
  await expect(btnCadastrar).toBeVisible();
  await btnCadastrar.click();
  console.log('CLICOU CADASTRAR USUÁRIO');
  
  const ruc = '989';
  const campoCI = page
  .locator('.q-field')
  .filter({ hasText: /\bci\b/i })
  .first()
  .locator('input');
  await campoCI.scrollIntoViewIfNeeded();
  await expect(campoCI).toBeVisible();
  await campoCI.fill('');
  await campoCI.type(ruc, { delay: 50 });
  console.log('RUC:', ruc);
  
  const nome = `TEST USUARIO ${Date.now()}`;
  const campoNome = page
  .locator('.q-field')
  .filter({ hasText: /nome/i })
  .first()
  .locator('input');
  await expect(campoNome).toBeVisible();
  await campoNome.fill(nome);
  console.log('NOME OK', nome);

  
  console.log('SOBRENOME VAZIO OK');

  const email = `autotest${Date.now()}test.com`;
  const campoEmail = page
  .locator('.q-field')
  .filter({ hasText: /e-mail/i })
  .first()
  .locator('input');
  await campoEmail.scrollIntoViewIfNeeded();
  await expect(campoEmail).toBeVisible();
  await campoEmail.fill(email);
  console.log('EMAIL ERRADO OK', email);

  const senha = `autosenhaX*${Date.now()}`;
  const camposenha = page
  .locator('.q-field')
  .filter({ hasText: /senha/i })
  .first()
  .locator('input');
  await camposenha.scrollIntoViewIfNeeded();
  await expect(camposenha).toBeVisible();
  await camposenha.fill(senha);
  console.log('SENHA OK', senha);

  const confirmarsenha = senha + 'a'
  const campoconfirmarsenha = page
  .locator('.q-field')
  .filter({ hasText: /confirmar nova senha/i })
  .first()
  .locator('input');
  await campoconfirmarsenha.scrollIntoViewIfNeeded();
  await expect(campoconfirmarsenha).toBeVisible();
  await campoconfirmarsenha.fill(confirmarsenha);
  console.log('SENHA CONFIRMAÇÃO DISTINTA OK', confirmarsenha);

  await page.locator('[aria-label="Perfil de acesso"]').click({ force: true });
  const cartao = page.locator('.q-menu:visible');
  await cartao.waitFor();
  await cartao
  .locator('.q-item')
  .filter({ hasText: /vendedor/i })
  .first()
  .click({ force: true });
  console.log('SELECIONOU PERFIL DE ACESSO OK');

  await page.locator('.q-btn')
  .filter({ hasText: /salvar|guardar/i })
  .click({ force: true });
  console.log('CLICOU EM SALVAR USUARIO');

  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);  
});
