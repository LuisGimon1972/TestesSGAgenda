import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test('Cadastro de perfil de acesso', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);

  await page.waitForTimeout(2000);       
  
  const salvarPerfilPromise = page.waitForResponse((response) =>
  response.url().includes('/api/perfil') &&
  ['POST'].includes(response.request().method()) &&
  response.status() >= 200 &&
  response.status() < 300);
  
  const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
  await expect(usuariosBtn).toBeVisible();
  await usuariosBtn.click();
  console.log('✅ Clicou em Usuários');

  await page.waitForTimeout(1000);
  page.locator('a[href*="usuario/perfil"]').click()
  console.log('✅ Clicou em Perfil de Acesso');
  
  const btnCadastrar = page.getByText(/cadastrar perfil/i).first();
  await expect(btnCadastrar).toBeVisible();
  await btnCadastrar.click();
  console.log('✅ Clicou em Cadastrar Peril de Acesso'); 
    
  console.log('DADOS ENVIADOS PRA API');
  const nome = `PERFIL ADMINISTRADOR ${Date.now()}`;
  const campoNome = page
  .locator('.q-field')
  .filter({ hasText: /nome/i })
  .first()
  .locator('input');
  await expect(campoNome).toBeVisible();
  await campoNome.fill(nome);
  console.log('✅ Nome do Perfil:', nome);

  await page.locator('[aria-label="Selecionar todos"]').click({ force: true });
  console.log('✅ Checkou em selecionar todos');

  await page.locator('.q-btn')
  .filter({ hasText: /salvar|guardar/i })
  .click({ force: true });
  console.log('✅ Clicou em EM Salvar Perfil de Acesso');
  console.log('FIM DE DADOS ENVIADOS');  

    const salvarUrlResponse = await salvarPerfilPromise;     
    const urlCompletaPost = salvarUrlResponse.url(); 

    const salvarPerfilResponse = await salvarPerfilPromise;
    const dadosSalvos = await salvarPerfilResponse.json();
    console.log('✅ DADOS RETORNADOS NA CRIAÇÃO');
    console.log(JSON.stringify(dadosSalvos, null, 2));
    
    const idPerfil = dadosSalvos.controle.toString().trim();    
    const urlRegistroCriado = `${urlCompletaPost}/${idPerfil}`;    
    const headersOriginais = salvarPerfilResponse.request().headers();
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
    console.log('✅ Novo Controle:', idPerfil);    
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
  
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);  
});