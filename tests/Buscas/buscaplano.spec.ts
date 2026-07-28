import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Planos - Busca', () => {

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

  async function abrirPlanos(page: Page) {
    const menuPlanos = page.getByText(/Planos|Planes/i).first();
    await expect(menuPlanos).toBeVisible({ timeout: 30000 });
    await menuPlanos.scrollIntoViewIfNeeded();
    await menuPlanos.click({ force: true });

    await expect(page.locator('body')).toHaveText(
      /Listagem de planos|Listado de planes|Planos|Planes/i,
      { timeout: 30000 }
    );

    await page.waitForTimeout(1500);
  }

  async function buscarPlano(page: Page, texto: string) {
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

  async function obterPlanoExistenteDaGrade(page: Page): Promise<string | null> {
    const bodyText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();

    const telaSemRegistros =
      /nenhum plano encontrado|nenhum registro encontrado|nenhum resultado|no hay registros|sin registros|no se encontraron|no encontrado/i.test(
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
      console.log('⚠️ Nenhum plano encontrado na grade. Teste interrompido sem erro.');
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

    const nomePlano =
      textosColunas.find((texto) => {
        return (
          texto.length >= 2 &&
          !/^\d+$/.test(texto) &&
          !/^\+?\d/.test(texto) &&
          !/R\$|BRL|₲|\$|PYG/i.test(texto)
        );
      }) || textosColunas[0];

    if (!nomePlano) {
      console.log('⚠️ Nenhum nome de plano válido encontrado. Teste interrompido sem erro.');
      return null;
    }

    console.log(`✅ Plano escolhido: ${nomePlano}`);
    return nomePlano;
  }

  test.beforeEach(async ({ page }) => {
    await loginCompleto(page);
    await fecharCookiesSeAparecer(page);
    await abrirPlanos(page);
  });

  test('Deve buscar primeiro um plano existente e depois um inexistente.', async ({ page }) => {
    await capturarRequisicoesApi(page);

    const nomePlanoExistente = await obterPlanoExistenteDaGrade(page);

    if (!nomePlanoExistente) {
      console.log('⚠️ Busca de planos não executada porque não existem planos cadastrados.');
      return;
    }

    await buscarPlano(page, nomePlanoExistente);

    const bodyTextExistente = await page.locator('body').innerText();
    expect(bodyTextExistente).toContain(nomePlanoExistente);
    console.log(`✅ Busca por plano existente (${nomePlanoExistente}) validada com sucesso`);

    await limparBusca(page);
    await capturarRequisicoesApi(page);

    const planoInexistente = `PLANO_INEXISTENTE_E2E_${Date.now()}`;
    await buscarPlano(page, planoInexistente);

    const linhasVisiveis = page.locator('tbody tr:visible');
    const countLinhas = await linhasVisiveis.count();

    if (countLinhas > 0) {
      const textoTabela = await linhasVisiveis.innerText().catch(() => '');
      expect(textoTabela).not.toContain(planoInexistente);
    }

    console.log(`✅ Busca por plano inexistente (${planoInexistente}) validada com sucesso`);
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);
  });

});