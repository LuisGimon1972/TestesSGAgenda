import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';

function gerarTelefoneAleatorio(): string {
  const ddd = '49';
  const primeiroDigito = '9';
  const numero = Math.floor(10000000 + Math.random() * 90000000);
  return `${ddd}${primeiroDigito}${numero}`;
}

function gerarCPFValido(): string {
  const rand = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, rand);

  const d1 = 11 - (n.reduce((acc, value, index) => acc + value * (10 - index), 0) % 11);
  n.push(d1 >= 10 ? 0 : d1);

  const d2 = 11 - (n.reduce((acc, value, index) => acc + value * (11 - index), 0) % 11);
  n.push(d2 >= 10 ? 0 : d2);

  return n.join('');
}

test.describe('Teste de Edição de Clientes', () => {

  async function fecharCookiesSeAparecer(page: Page) {
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (/Entendi|Aceitar|Aceito|OK|Concordo/i.test(bodyText)) {
      const btnCookies = page.getByText(/Entendi/i).first();
      if (await btnCookies.isVisible().catch(() => false)) {
        await btnCookies.click({ force: true, timeout: 5000 }).catch(() => {});
        console.log('✅ Fechou aviso de cookies');
      }
    }
  }

  test.beforeEach(async ({ page }) => {
    await loginCompleto(page);    
    await fecharCookiesSeAparecer(page);    

    const menuClientes = page.getByText(/Clientes/i).first();
    await expect(menuClientes).toBeVisible({ timeout: 30000 });
    await menuClientes.scrollIntoViewIfNeeded();
    await menuClientes.click({ force: true });   

    await expect(page.getByText(/Clientes/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('Deve selecionar aleatoriamente um cliente da lista e abrir edição.', async ({ page }) => {   
    
    const linhas = page.locator('tbody tr');

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 cliente').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);    

    await page.waitForTimeout(2000);     

    const nomeClientee = (await linhaSelecionada.locator('td').nth(0).innerText()).trim();
    console.log(`✅ Cliente selecionado: ${nomeClientee}`);    

    const btnEditar = linhaSelecionada
      .locator([
        'button:has-text("edit")',
        'button:has-text("editar")',
        'a:has-text("edit")',
        'a:has-text("editar")',
        'i:has-text("edit")',
        'i:has-text("editar")',
        '[title*="edit" i]',
        '[title*="editar" i]',
        '[aria-label*="edit" i]',
        '[aria-label*="editar" i]',
        '.q-btn:has(.q-icon)',
        'td:last-child button',
        'td:last-child a'
      ].join(', '))
      .nth(1);

    // 2. Aguarda estar visível/pronto e clica
    await btnEditar.waitFor({ state: 'visible', timeout: 5000 });
    await btnEditar.scrollIntoViewIfNeeded().catch(() => {});
    await btnEditar.click({ force: true });
    
    console.log('✅ Clicou no botão Editar da linha');

    await page.waitForTimeout(1000); 
    
    const salvarPessoaPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/customers') || response.url().includes('/pessoa')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
    ).catch(() => null);

    const timestamp = Date.now();
    const nomeCliente = obterNomePessoaAleatorio();
    const documento = gerarCPFValido();
    const telefone = gerarTelefoneAleatorio();    
    const email = `cliente_email.${timestamp}@sgbr.com`;    
    
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
      try {
        const campo = page.locator('input:visible').nth(index);       
        
        await campo.waitFor({ state: 'visible', timeout: 10000 });                              
        await campo.clear();        
        await page.waitForTimeout(100);
        
        if (texto) {        
          await campo.fill(texto); 
        }

        console.log(`✅ ${nomeCampo}: ${texto}`);
      } catch (e) {
        console.error(`❌ Falha ao tentar preencher o campo: ${nomeCampo}`, e);
      }
    };
    
    await preencherCampo(0, nomeCliente, 'Nome Completo Alterado');
    await preencherCampo(1, telefone, 'Telefone Alterado');
    await preencherCampo(2, documento, 'Documento Alterado');
    await preencherCampo(3, email, 'Email Alterado');
    await preencherCampo(4, '1990-05-20', 'Data de Nascimento Alterada');

    await page.waitForTimeout(500);       

    const btnGravar = page.getByText(/Gravar alterações/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar alterações');                 

    let respostaJson: any = null;
    const salvarResponse = await salvarPessoaPromise;    

    if (salvarResponse) {
      console.log('🌐 A URL capturada do POST/PUT é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);

      try {        
        respostaJson = await salvarResponse.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJson, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }
    }    
    
    let idPessoa = respostaJson?.data?.id?.toString()?.trim() || respostaJson?.id?.toString()?.trim();
    
    if (!idPessoa && salvarResponse) {
      const urlInterceptada = salvarResponse.url();      
      const uuidMatch = urlInterceptada.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      
      if (uuidMatch) {
        idPessoa = uuidMatch[0];
      } else {
        // Fallback: pega a última parte da URL após a barra "/"
        const partes = urlInterceptada.split('?')[0].split('/');
        idPessoa = partes[partes.length - 1];
      }
    }
    
    if (salvarResponse && idPessoa) {     
      const urlSemQuery = salvarResponse.url().split('?')[0];
      
      const urlRegistroCriado = urlSemQuery.endsWith(idPessoa) 
        ? urlSemQuery 
        : `${urlSemQuery}/${idPessoa}`;      
        
      const headersGetRegistro = { ...salvarResponse.request().headers() };      
      delete headersGetRegistro['content-type'];
      delete headersGetRegistro['content-length'];
      delete headersGetRegistro[':method'];
      delete headersGetRegistro[':path'];
      delete headersGetRegistro[':authority'];
      delete headersGetRegistro[':scheme'];      
      
      const getCriadoResponse = await page.request.get(urlRegistroCriado, {
        headers: headersGetRegistro,
      });

      console.log('🌐 URL do registro atualizado:', urlRegistroCriado);
      console.log('✅ RESPOSTA DA API AO CONSULTAR O REGISTRO');
      console.log('✅ ID do Registro:', idPessoa);    
      console.log(`✅ Status GET: ${getCriadoResponse.status()}`);

      try {
        const dadosCriado = await getCriadoResponse.json();
        console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(dadosCriado, null, 2));
      } catch (error) {
        console.error('⚠️ Erro ao converter resposta para JSON no GET:', error);
      }
    } else {
      console.log('⚠️ Não foi possível identificar o ID do registro na URL nem no JSON.');
    }   
       
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});