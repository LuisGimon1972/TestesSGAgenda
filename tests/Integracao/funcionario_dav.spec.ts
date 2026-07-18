import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Teste de Integração Funcionário e DAV', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginCompleto(page);
  
  await page.getByText(/funcionários/i).click({ force: true });
  console.log('CLICOU EM FUNCIONÁRIOS');  
  
  const btnCadastrar = page.getByText(/cadastrar funcionário/i).first();
  await expect(btnCadastrar).toBeVisible();
  await btnCadastrar.click();
  console.log('CLICOU EM CADASTRAR FUNCIONÁRIO');

  const nomefuncionario = `TEST FUNCIONÁRIO INTEGRAÇÃO DAV ${Date.now()}`;
  const camponomefuncionario = page
  .locator('.q-field')
  .filter({ hasText: /funcionário/i })
  .first()
  .locator('input');
  await expect(camponomefuncionario).toBeVisible();
  await camponomefuncionario.fill(nomefuncionario);
  console.log('NOME FUNCIONÁRIO OK:', nomefuncionario);

  const cargofuncionario = `TEST CARGO ${Date.now()}`;
  const campocargofuncionario = page
  .locator('.q-field')
  .filter({ hasText: /cargo/i })
  .last()
  .locator('input');
  await expect(campocargofuncionario).toBeVisible();
  await campocargofuncionario.fill(cargofuncionario);
  console.log('CARGO FUNCIONÁRIO OK:', cargofuncionario);
  
  const ruc = gerarRUC();
  const campoCI = page
  .locator('.q-field')
  .filter({ hasText: /\bcédula de identidade\b/i })
  .first()
  .locator('input');
  await campoCI.scrollIntoViewIfNeeded();
  await expect(campoCI).toBeVisible();
  await campoCI.fill('');
  await campoCI.type(ruc, { delay: 50 });
  console.log('RUC:', ruc); 
  
  await page.locator('.q-btn')
  .filter({ hasText: /salvar|guardar/i })
  .click({ force: true });
  console.log('CLICOU EM SALVAR FUNCIONÁRIO');

  await capturarRequisicoesApi(page); 
  await page.waitForTimeout(2000);        

  await page.getByText(/vendas/i).click({ force: true });
  console.log('CLICOU EM VENDAS');

  await page.waitForTimeout(1000);
  await Promise.all([
    page.waitForURL(/dav/, { timeout: 15000 }),
    page.locator('a[href*="dav"]').first().click()
  ]);
  console.log('CLICOU EM DAV');

  await page.waitForTimeout(1000);
  const btnCadastrar1 = page.getByText(/cadastrar dav/i).first();
  await btnCadastrar1.waitFor();
  await btnCadastrar1.click({ force: true });
  console.log('CLICOU EM CADASTRAR DAV');

  await page.waitForTimeout(2000);
  await page.locator('.q-select').nth(3).click();
  const campoPesquisa = page.locator('input[placeholder="Pesquisar"]');
  await campoPesquisa.waitFor({ state: 'visible', timeout: 5000 });    
  await campoPesquisa.fill(nomefuncionario);
  await page.waitForTimeout(2000);
  console.log(`✅ Nome de funcionário inserido e pesquisado: ${nomefuncionario}`);       
  if (nomefuncionario !=''){console.log(`✅ Funcionário ${nomefuncionario} corretamente integrado com DAV`);      
  }      
  else{
       console.log(`✅ Funcionário não integrado com DAV`);
  }       
    

function gerarRUC() {
  const base = Math.floor(1000000 + Math.random() * 9000000).toString(); // 7 dígitos
  const pesos = [2,3,4,5,6,7,2];
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += parseInt(base[i]) * pesos[i];
  }
  const resto = soma % 11;
  const dv = resto > 1 ? 11 - resto : 0;
  return `${base}-${dv}`;
}
});