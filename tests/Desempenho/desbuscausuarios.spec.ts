import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Teste de Desempenho de busca em Usuários', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });

  const inicioLogin = Date.now();
  await loginCompleto(page);    
  const fimLogin = Date.now();
  
  const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
  await expect(usuariosBtn).toBeVisible();
  await usuariosBtn.click();
  console.log('CLICOU EM USUÁRIOS');

  const listado = page.locator('a[href*="usuario/listado"]');
  await expect(listado).toBeVisible();
  await listado.click();
  console.log('CLICOU EM LISTAGEM DE USUARIOS');

     const primeiroNome = `TEST USUARIO`;
     const inicioBuscaExistente = Date.now();
     await page.getByLabel(/pesquisar registro/i).fill(primeiroNome);
     await page.keyboard.press('Enter');
     const fimBuscaExistente = Date.now();
     const tempoBuscaExistente = fimBuscaExistente - inicioBuscaExistente;
     console.log('BUSCA  USUÁRIO EXISTENTE OK:', primeiroNome);

    await page.waitForTimeout(1000);

    const prodInexistente = `USUÁRIO INEXISTENTE`;
    const inicioBuscaInexistente = Date.now();
    await page.getByLabel(/pesquisar registro/i).fill(prodInexistente);
    await page.keyboard.press('Enter');
    const fimBuscaInexistente = Date.now();
    const tempoBuscaInexistente = fimBuscaInexistente - inicioBuscaInexistente;
    console.log('BUSCA USUÁRIO INEXISTENTE OK:', prodInexistente);
    
    const tempoLogin = fimLogin - inicioLogin;
    console.log(`⏱️ Tempo total do Login: ${tempoLogin} ms`);

    const tempoTotal = tempoBuscaExistente + tempoBuscaInexistente;
    console.log(`⏱️ Tempo total das buscas: ${tempoTotal} ms`);
    if (tempoTotal > 1000) {
        console.log('⚠️ Tempo acima do limite esperado [1000 ms]');
    }else {
        console.log(`✅ Tempo da busca dentro do limite[1000 ms]: ${tempoTotal} ms`);
    }

    const totalGeral = tempoLogin + tempoTotal;
    console.log(`⏱️Tempo total Módulo: ${totalGeral} ms`);
});