import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { capturarRequisicaoApiCadastro } from '../../utils/capturaApipayload';

test('Desempenho Cadastro de funcionários', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  const inicioLogin = Date.now();
  await loginCompleto(page);    
  const fimLogin = Date.now();

  const inicio = Date.now();
  
  await page.getByText(/funcionários/i).click({ force: true });
  console.log('CLICOU EM FUNCIONÁRIOS');  
  
  const btnCadastrar = page.getByText(/cadastrar funcionário/i).first();
  await expect(btnCadastrar).toBeVisible();
  await btnCadastrar.click();
  console.log('CLICOU CADASTRAR FUNCIONÁRIO');

  const nomefuncionario = `TEST FUNCIONARIO DESEMPENHO  ${Date.now()}`;
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

  await capturarRequisicaoApiCadastro(page, '/api/py/funcionario'); 
  
  await capturarRequisicoesApi(page);   

  const tempoLogin = fimLogin - inicioLogin;
  console.log(`⏱️Tempo total do Login: ${tempoLogin} ms`);

  const fim = Date.now();
  const tempoTotal = fim - inicio;
  console.log(`⏱️Tempo total do Cadastro: ${tempoTotal} ms`);  
  if (tempoTotal > 8000) {
       console.log('⚠️ Tempo acima do limite esperado [8000 ms]');
  } else {
        console.log(`✅ Tempo do cadastro dentro do limite[8000 ms]: ${tempoTotal} ms`);
  }
  
  const totalGeral = tempoLogin + tempoTotal;
  console.log(`⏱️Tempo total Módulo: ${totalGeral} ms`);
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