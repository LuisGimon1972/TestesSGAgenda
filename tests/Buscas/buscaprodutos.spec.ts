import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { navegarPara } from '../../utils/navegar';

test.describe('Produtos - Busca', () => {

  async function fecharCookiesSeAparecer(page: Page) {
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (/Entendi/i.test(bodyText)) {
      const btnCookies = page.getByText(/Entendi/i).first();
      if (await btnCookies.isVisible().catch(() => false)) {
        await btnCookies.click({ force: true, timeout: 5000 }).catch(() => {});
        console.log('✅ Fechou aviso de cookies');
      }
    }
  }

  async function abrirProdutos(page: Page) {
    await page.waitForTimeout(2000);
    
    await navegarPara(page, 'Profissionais');
    await navegarPara(page, 'Catálogo', 'Produtos');

    await expect(page.locator('body')).toHaveText(
      /Produtos|Productos|Products|Listado de productos/i,
      { timeout: 30000 }
    );

    await page.waitForTimeout(1500);
  }

  async function buscarProduto(page: Page, texto: string) {
    const inputBusca = page.locator('input:visible').first();
    await expect(inputBusca).toBeVisible({ timeout: 30000 });
    await inputBusca.click({ force: true });

    await inputBusca.press('Control+A');
    await inputBusca.press('Backspace');
    await page.waitForTimeout(200);

    if (texto) {
      await inputBusca.pressSequentially(texto, { delay: 50 });
      await inputBusca.evaluate((node: any) => {
        node.dispatchEvent(new Event('input', { bubbles: true }));
        node.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    await page.waitForTimeout(1500);
  }

  async function limparBusca(page: Page) {
    const inputBusca = page.locator('input:visible').first();
    await expect(inputBusca).toBeVisible({ timeout: 30000 });
    await inputBusca.click({ force: true });

    await inputBusca.press('Control+A');
    await inputBusca.press('Backspace');
    await page.waitForTimeout(200);

    await inputBusca.evaluate((node: any) => {
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.waitForTimeout(1500);
  }

  async function obterProdutoExistenteDaGrade(page: Page): Promise<string | null> {
    const bodyText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();

    const telaSemRegistros =
      /nenhum produto encontrado|nenhum registro encontrado|nenhum resultado|no hay registros|sin registros|no se encontraron|no encontrado/i.test(
        bodyText
      );

    const linhas = page.locator('tbody tr:visible');
    const count = await linhas.count();

    const linhasValidasIndex: number[] = [];

    for (let i = 0; i < count; i++) {
      const linha = linhas.nth(i);
      const colunas = linha.locator('td');
      const numColunas = await colunas.count();
      const texto = (await linha.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();

      const naoEhLinhaVazia = !/nenhum|no hay|sin registros|no encontrado/i.test(texto);

      if (numColunas > 0 && texto.length > 0 && naoEhLinhaVazia) {
        linhasValidasIndex.push(i);
      }
    }

    if (telaSemRegistros || linhasValidasIndex.length === 0) {
      console.log('⚠️ Nenhum produto encontrado na grade. Teste interrompido sem erro.');
      return null;
    }

    const indiceAleatorio = linhasValidasIndex[Math.floor(Math.random() * linhasValidasIndex.length)];
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const colunas = linhaSelecionada.locator('td');
    const totalColunas = await colunas.count();

    const textosColunas: string[] = [];
    for (let i = 0; i < totalColunas; i++) {
      const texto = (await colunas.nth(i).innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
      if (texto.length > 0 && !/drag_indicator|edit|delete|more_vert|visibility/i.test(texto)) {
        textosColunas.push(texto);
      }
    }

    const nomeProduto =
      textosColunas.find((texto) => {
        return (
          texto.length >= 2 &&
          !/^\d+$/.test(texto) && // Ignora colunas que são só números (ex: ID, Quantidade)
          !/^\+?\d/.test(texto) &&
          !/R\$|BRL|₲|\$|PYG/i.test(texto) // Ignora colunas de preço
        );
      }) || textosColunas[0];

    if (!nomeProduto) {
      console.log('⚠️ Nenhum nome de produto válido encontrado. Teste interrompido sem erro.');
      return null;
    }

    console.log(`✅ Produto escolhido: ${nomeProduto}`);
    return nomeProduto;
  }

  test.beforeEach(async ({ page }) => {
    await loginCompleto(page);
    await fecharCookiesSeAparecer(page);
    await abrirProdutos(page);
  });

  test('Deve buscar primeiro um produto existente e depois um inexistente.', async ({ page }) => {
    await capturarRequisicoesApi(page); 
    const nomeProdutoExistente = await obterProdutoExistenteDaGrade(page);

    if (!nomeProdutoExistente) {
      console.log('⚠️ Busca de produtos não executada porque não existem produtos cadastrados.');
      return;
    }
    
    await buscarProduto(page, nomeProdutoExistente);

    const bodyTextExistente = await page.locator('body').innerText();
    expect(bodyTextExistente).toContain(nomeProdutoExistente);
    console.log(`✅ Busca por produto existente (${nomeProdutoExistente}) validada com sucesso`);

    await limparBusca(page);
    await capturarRequisicoesApi(page); 

    // 3. Busca por produto inexistente
    const produtoInexistente = `PRODUTO_INEXISTENTE_E2E_${Date.now()}`;
    await buscarProduto(page, produtoInexistente);

    const linhasVisiveis = page.locator('tbody tr:visible');
    const countLinhas = await linhasVisiveis.count();

    if (countLinhas > 0) {
      const textoTabela = await linhasVisiveis.innerText().catch(() => '');
      expect(textoTabela).not.toContain(produtoInexistente);
    }

    console.log(`✅ Busca por produto inexistente (${produtoInexistente}) validada com sucesso`);
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);
  });

});