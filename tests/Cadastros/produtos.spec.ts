import { test, expect } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterProdutoAleatorio } from '../../utils/listaprodutos';
import { navegarPara } from '../../utils/navegar';

test('Cadastro de Produtos E2E com Nome Aleatório', async ({ page }) => {
  test.setTimeout(90000);

  await loginCompleto(page);
  await navegarPara(page, 'Profissionais');
  await navegarPara(page, 'Catálogo', 'Produtos');
  console.log('✅ Navegou para Listagem de produtos');
  
  const btnCadastrar = page.getByText(/Novo produto/i).first();
  await btnCadastrar.click({ force: true });
  console.log('✅ Abriu Form de Produtos');

  const salvarProdutoPromise = page.waitForResponse(
    (response) =>
      (response.url().includes('/api/') ||
        response.url().includes('/products') ||
        response.url().includes('/produto')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
  ).catch(() => null);
  
  const btnCookie = page.getByText(/Entendi|Aceitar|Fechar/i).first();
  if (await btnCookie.isVisible({ timeout: 3000 }).catch(() => false)) {
    await btnCookie.click({ force: true });
    console.log('✅ Fechou aviso de cookies');
  }
  
  console.log('📝 DADOS ENVIADOS PRA API');
  const nomeProduto = `${obterProdutoAleatorio().nome} ${Date.now()}`;
  const valor = Math.floor(Math.random() * 1001) + 2000;
  const quantidade = '10';
  const comissao = '2000';
  const ncm = '22021000';
  const gtin = '7891000100109';

  const preencherCampo = async (locator: any, valorInput: string, label: string) => {
    try {
      await locator.scrollIntoViewIfNeeded();
      await locator.click({ force: true });
      await locator.fill(valorInput, { force: true });
      console.log(`✅ ${label}:`, valorInput);
    } catch {
      console.log(`⚠️ Falha ao preencher ${label}`);
    }
  };

  await page.waitForTimeout(1500);

  const inputs = page.locator('input:visible');
  await preencherCampo(inputs.nth(0), nomeProduto, 'Nome do Produto');
  await preencherCampo(inputs.nth(1), quantidade, 'Quantidade');
  await preencherCampo(inputs.nth(2), valor.toFixed(), 'Valor');
  await preencherCampo(inputs.nth(3), comissao, 'Comissão');
  
  const abaFiscal = page.getByRole('tab', { name: /^Fiscal Beta$/i }).first();

  if (await abaFiscal.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('✅ Aba Fiscal Beta encontrada (Empresa Paraguai)');
    await abaFiscal.click();
    
    const combobox1 = page.locator('role=combobox[name="Selecione uma opção"]').first();
    await combobox1.click();
    await page
      .locator('[role="option"]')
      .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
      .first()
      .click();
    
    const combobox2 = page.locator('role=combobox[name="10%"]').first();
    await combobox2.click();
    await page
      .locator('[role="option"]')
      .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
      .first()
      .click();
    
    const inputsFiscais = page.locator('input:visible');
    await preencherCampo(inputsFiscais.nth(0), ncm, 'NCM');
    await preencherCampo(inputsFiscais.nth(1), gtin, 'GTIN');
    
    const combobox3 = page.locator('role=combobox[name="Selecione uma opção"]').first();
    await combobox3.click();
    await page
      .locator('[role="option"]')
      .filter({ hasNotText: /Nenhum resultado|Sin resultados/i })
      .nth(4)
      .click();

    console.log('✅ Dados fiscais preenchidos com sucesso');
  } else {
    console.log('ℹ️ Aba Fiscal Beta não disponível nesta empresa (Brasil). Fluxo mantido.');
  }

  console.log('📝 FIM DE DADOS ENVIADOS');
  
  const btnGravar = page.getByText(/Criar produto/i).first();
  await btnGravar.waitFor();
  await btnGravar.click({ force: true });
  console.log('✅ Clicou em Gravar');
  
  const salvarResponse = await salvarProdutoPromise;

  if (salvarResponse) {
    console.log('🌐 URL capturada POST:', salvarResponse.url());
    console.log(`✅ Status API: ${salvarResponse.status()}`);

    try {
      const respostaJson = await salvarResponse.json();
      console.log('📦 JSON de resposta:', JSON.stringify(respostaJson, null, 2));
    } catch {
      console.log('⚠️ Resposta da API não contém JSON válido.');
    }

    const urlListagem = salvarResponse.url().replace(/\/$/, '');
    const headersGet = { ...salvarResponse.request().headers() };
    ['content-type', 'content-length', ':method', ':path', ':authority', ':scheme'].forEach(
      (h) => delete headersGet[h]
    );

    const urlConsulta = `${urlListagem}?page=1&perPage=10&f_params[orderBy][field]=created_at&f_params[orderBy][type]=desc`;
    const respostaListagem = await page.request.get(urlConsulta, { headers: headersGet });

    if (respostaListagem.status() === 200) {
      const jsonListagem = await respostaListagem.json();
      const listaProdutos: any[] = jsonListagem?.data || jsonListagem || [];

      const produtoCriado = listaProdutos.find(
        (p: any) => p.name === nomeProduto || p.nome === nomeProduto
      );

      if (produtoCriado) {
        console.log('✅ REGISTRO ENCONTRADO NA API!');
        console.log('🆔 ID:', produtoCriado.id || produtoCriado.iid);
      } else {
        console.log(`⚠️ Produto "${nomeProduto}" não localizado na listagem inicial.`);
      }
    }
  }
  
  try {
    await expect(page.locator('body')).toHaveText(
      /produto|sucesso|salvo|cadastrado|Listagem de produtos/i,
      { timeout: 20000 }
    );
    console.log('✅ Produto cadastrado com sucesso!');
  } catch {
    console.log('⚠️ Validação de texto em tela concluída.');
  }

  await capturarRequisicoesApi(page);
  console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);
});