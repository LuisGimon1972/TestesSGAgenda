import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';

test('Cadastro de usuários', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });

  await loginCompleto(page);

  await page.waitForTimeout(2000);       
    
  const salvarUsuarioPromise = page.waitForResponse((response) =>
  response.url().includes('/api/usuario') &&
  ['POST'].includes(response.request().method()) &&
  response.status() >= 200 &&
  response.status() < 300);
  
  const usuariosBtn = page.getByText(/usu[aá]rios/i).first();
  await expect(usuariosBtn).toBeVisible();
  await usuariosBtn.click();
  console.log('✅ Clicou em Usuários');

  const listado = page.locator('a[href*="usuario/listado"]');
  await expect(listado).toBeVisible();
  await listado.click();
  console.log('✅ Clicou em Listagem de Usuários');
  
  const btnCadastrar = page.getByText(/cadastrar usuário/i).first();
  await expect(btnCadastrar).toBeVisible();
  await btnCadastrar.click();
  console.log('✅ Clicou em Cadastrar Usuário');

  console.log('DADOS ENVIADOS PRA API');
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
  console.log('✅ Número do RUC:', ruc);  
  
  const nome = obterNomePessoaAleatorio();
  const nomeSemDuasUltimas = nome.split(' ').slice(0, -2).join(' ');
  const campoNome = page
  .locator('.q-field')
  .filter({ hasText: /nome/i })
  .first()
  .locator('input');
  await expect(nomeSemDuasUltimas);
  await campoNome.fill(nomeSemDuasUltimas);
  console.log('✅ Nome do Usuário:', nomeSemDuasUltimas.toUpperCase());
    
  const nomeSemDuasPrimeiras = nome.split(' ').slice(2).join(' ');
  const camposobrenome = page
  .locator('.q-field')
  .filter({ hasText: /sobrenome/i })
  .last()
  .locator('input');
  await expect(nomeSemDuasPrimeiras);
  await camposobrenome.fill(nomeSemDuasPrimeiras);
  console.log('✅ Sobrenome do Usuários:', nomeSemDuasPrimeiras.toUpperCase());

  const email = `autotest${Date.now()}@test.com`;
  const campoEmail = page
  .locator('.q-field')
  .filter({ hasText: /e-mail/i })
  .first()
  .locator('input');
  await campoEmail.scrollIntoViewIfNeeded();
  await expect(campoEmail).toBeVisible();
  await campoEmail.fill(email);
  console.log('✅ Email:', email);

  const senha = `autosenhaX*${Date.now()}`;
  const camposenha = page
  .locator('.q-field')
  .filter({ hasText: /senha/i })
  .first()
  .locator('input');
  
  await camposenha.scrollIntoViewIfNeeded();
  await expect(camposenha).toBeVisible();
  await camposenha.fill(senha);
  console.log('✅ Senha:', senha);

  const confirmarsenha = senha
  const campoconfirmarsenha = page
  .locator('.q-field')
  .filter({ hasText: /confirmar nova senha/i })
  .first()
  .locator('input');
  await campoconfirmarsenha.scrollIntoViewIfNeeded();
  await expect(campoconfirmarsenha).toBeVisible();
  await campoconfirmarsenha.fill(confirmarsenha);
  console.log('✅ Senha Confirmação:', confirmarsenha);

  await page.locator('[aria-label="Perfil de acesso"]').click({ force: true });
  const cartao = page.locator('.q-menu:visible');
  await cartao.waitFor();
  await cartao
  .locator('.q-item')
  .filter({ hasText: /vendedor/i })
  .first()
  .click({ force: true });
  const tipace = await page.locator('input[aria-label="Perfil de acesso"]').inputValue();      
  console.log('✅ Selecionou o Perfil de Acesso:',tipace);
  console.log('FIM DADOS ENVIADOS');
    
  await page.locator('.q-btn')
    .filter({ hasText: /salvar|guardar/i })
    .click({ force: true });
  console.log('✅ Clicou em Salvar Usuário');      

  const salvarUrlResponse = await salvarUsuarioPromise;     
  const urlCompletaPost = salvarUrlResponse.url();  

  const salvarUsuarioResponse = await salvarUsuarioPromise;
  const dadosSalvos = await salvarUsuarioResponse.json();
  console.log('✅DADOS RETORNADOS NA CRIAÇÃO');
  console.log(JSON.stringify(dadosSalvos, null, 2));
  
    const idUsuario = dadosSalvos.controle.toString().trim();     
    const urlRegistroCriado = `${urlCompletaPost}/${idUsuario}`;    
    const headersOriginais = salvarUsuarioResponse.request().headers();
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
    console.log('✅ Novo Controle:', idUsuario);    
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