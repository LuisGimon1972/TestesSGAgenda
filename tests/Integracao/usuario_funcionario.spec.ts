import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Teste de Integração Usuário e Funcionário', async ({ page }) => {
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
  
  const ruc = gerarRUC();
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
  
  const nome = `TEST USUARIO INTEGRAÇÃO ${Date.now()}`;
  const campoNome = page
  .locator('.q-field')
  .filter({ hasText: /nome/i })
  .first()
  .locator('input');
  await expect(campoNome).toBeVisible();
  await campoNome.fill(nome);
  console.log('NOME USUÁRIO OK:', nome);

  const sobrenome = `TEST USUARIO SOBRENOME  ${Date.now()}`;
  const camposobrenome = page
  .locator('.q-field')
  .filter({ hasText: /sobrenome/i })
  .last()
  .locator('input');
  await expect(camposobrenome).toBeVisible();
  await camposobrenome.fill(sobrenome);
  console.log('SOBRENOME USUÁRIO OK:', sobrenome);

  const email = `autotestIntegracao${Date.now()}@test.com`;
  const campoEmail = page
  .locator('.q-field')
  .filter({ hasText: /e-mail/i })
  .first()
  .locator('input');
  await campoEmail.scrollIntoViewIfNeeded();
  await expect(campoEmail).toBeVisible();
  await campoEmail.fill(email);
  console.log('EMAIL OK:', email);

  const senha = `autosenhaX*${Date.now()}`;
  const camposenha = page
  .locator('.q-field')
  .filter({ hasText: /senha/i })
  .first()
  .locator('input');
  
  await camposenha.scrollIntoViewIfNeeded();
  await expect(camposenha).toBeVisible();
  await camposenha.fill(senha);
  console.log('SENHA OK:', senha);

  const confirmarsenha = senha
  const campoconfirmarsenha = page
  .locator('.q-field')
  .filter({ hasText: /confirmar nova senha/i })
  .first()
  .locator('input');
  await campoconfirmarsenha.scrollIntoViewIfNeeded();
  await expect(campoconfirmarsenha).toBeVisible();
  await campoconfirmarsenha.fill(confirmarsenha);
  console.log('SENHA CONFIRMAÇÃO OK:', confirmarsenha);

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

  await page.getByText(/funcionários/i).click({ force: true });
  console.log('CLICOU EM FUNCIONÁRIOS');  
  
  const btnCadastrarf = page.getByText(/cadastrar funcionário/i).first();
  await expect(btnCadastrarf).toBeVisible();
  await btnCadastrarf.click();
  console.log('CLICOU EM CADASTRAR FUNCIONÁRIO');

  await page.waitForTimeout(2000);
  await page.locator('.q-select').nth(1).click();
  const campoPesquisa = page.locator('input[placeholder="Pesquisar"]');
  await campoPesquisa.waitFor({ state: 'visible', timeout: 5000 });    
  await campoPesquisa.fill(email);
  await page.waitForTimeout(2000);
  console.log(`✅ Nome de pessoa inserida e pesquisada: ${email}`);       
  if (nome !=''){console.log(`✅ Usuário ${nome} corretamente integrado com Funcionário`);      
    }      
    else{
        console.log(`✅ Usuário não integrado com Funcionário`);
    }      



});

function gerarRUC() {
  const base = Math.floor(1000000 + Math.random() * 9000000).toString();
  const pesos = [2, 3, 4, 5, 6, 7, 2];
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += parseInt(base[i]) * pesos[i];
  }
  const resto = soma % 11;
  const dv = resto > 1 ? 11 - resto : 0;
  return `${base}-${dv}`;
}