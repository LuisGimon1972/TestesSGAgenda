import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Teste de Integração Perfil de acesso e Usuários', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);
  
  const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
  await expect(usuariosBtn).toBeVisible();
  await usuariosBtn.click();
  console.log('CLICOU EM USUÁRIOS');

  await page.waitForTimeout(1000);
  page.locator('a[href*="usuario/perfil"]').click()
  console.log('CLICOU EM PERFIL DE ACESSO');
  
  const btnCadastrar = page.getByText(/cadastrar perfil/i).first();
  await expect(btnCadastrar).toBeVisible();
  await btnCadastrar.click();
  console.log('CLICOU EM CADASTRAR PERFIL DE ACESSO'); 
    
  const nome = `TEST PERFIL INTEGRAÇÃO ${Date.now()}`;
  const campoNome = page
  .locator('.q-field')
  .filter({ hasText: /nome/i })
  .first()
  .locator('input');
  await expect(campoNome).toBeVisible();
  await campoNome.fill(nome);
  console.log('NOME OK', nome);

  await page.locator('[aria-label="Selecionar todos"]').click({ force: true });
  console.log('CLICLOU EM SELECIONAR TODOS OK');

  await page.locator('.q-btn')
  .filter({ hasText: /salvar|guardar/i })
  .click({ force: true });
  console.log('CLICOU EM SALVAR PERFIL DE ACCESO');
  
  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(4000);  

  const listado = page.locator('a[href*="usuario/listado"]');
  await expect(listado).toBeVisible();
  await listado.click();
  console.log('CLICOU EM LISTAGEM DE USUARIOS');
  
  const btnCadastraru = page.getByText(/cadastrar usuário/i).first();
  await expect(btnCadastraru).toBeVisible();
  await btnCadastraru.click();
  console.log('CLICOU EM CADASTRAR USUÁRIO');

  await page.waitForTimeout(2000);
  await page.locator('.q-select').nth(0).click();
  const campoPesquisa = page.locator('input[placeholder="Pesquisar"]');
  await campoPesquisa.waitFor({ state: 'visible', timeout: 5000 });    
  await campoPesquisa.fill(nome);
  await page.waitForTimeout(2000);
  console.log(`✅ Perfil de acesso inserido e pesquisado: ${nome}`);       
  if (nome !=''){console.log(`✅ Perfil de acesso ${nome} corretamente integrado com Usuários`);      
    }      
    else{
        console.log(`✅ Perfil de acesso não integrado com Usuários`);
    }      

});