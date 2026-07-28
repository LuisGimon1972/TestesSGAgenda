import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';

test.describe('Atendentes - Busca', () => {

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

  async function abrirAtendentes(page: Page) {
    const menuAtendentes = page.getByText(/Atendentes/i).first();
    await expect(menuAtendentes).toBeVisible({ timeout: 30000 });
    await menuAtendentes.scrollIntoViewIfNeeded();
    await menuAtendentes.click({ force: true });
    await page.waitForTimeout(1000);

    await expect(page.getByText(/Listagem de atendentes/i).first()).toBeVisible({ timeout: 30000 });
  }

  async function buscarAtendente(page: Page, texto: string) {
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
    await buscarAtendente(page, '');
  }

  async function obterAtendenteExistenteDaGrade(page: Page): Promise<string | null> {
    const linhas = page.locator('tbody tr:visible');
    const count = await linhas.count();

    if (count === 0) {
      console.log('⚠️ Nenhum atendente encontrado na grade. Teste encerrado sem falha.');
      return null;
    }

    const atendentesValidos: string[] = [];

    for (let i = 0; i < count; i++) {
      const linha = linhas.nth(i);
      const colunas = linha.locator('td');
      const numColunas = await colunas.count();

      if (numColunas > 0) {
        const textoLinha = (await linha.innerText()).trim();
        if (textoLinha.length > 0) {
          const nomeCliente = (await colunas.nth(0).innerText()).trim();
          if (nomeCliente && !/drag_indicator/i.test(nomeCliente)) {
            atendentesValidos.push(nomeCliente);
          }
        }
      }
    }

    if (atendentesValidos.length === 0) {
      console.log('⚠️ Linhas encontradas, mas sem nome de cliente válido.');
      return null;
    }

    const indiceAleatorio = Math.floor(Math.random() * atendentesValidos.length);
    const atendenteEscolhido = atendentesValidos[indiceAleatorio];

    console.log(`✅ Atendente escolhido para busca: ${atendenteEscolhido}`);
    return atendenteEscolhido;
  }

  test.beforeEach(async ({ page }) => {
    await loginCompleto(page);
    await fecharCookiesSeAparecer(page);
    await abrirAtendentes(page);
  });

  test('Deve buscar primeiro um atendente existente e depois um inexistente.', async ({ page }) => {
    const nomeAtendenteExistente = await obterAtendenteExistenteDaGrade(page);

    if (!nomeAtendenteExistente) {
      console.log('⚠️ Teste interrompido pois não havia atendentes na grade.');
      return;
    }
    
    await buscarAtendente(page, nomeAtendenteExistente);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(nomeAtendenteExistente);
    console.log(`✅ Busca por atendente existente (${nomeAtendenteExistente}) validada com sucesso`);

   
    await limparBusca(page);

    const atendenteInexistente = `ATENDENTE_INEXISTENTE_${Date.now()}`;
    await buscarAtendente(page, atendenteInexistente);

    const textoTabela = await page.locator('tbody').innerText().catch(() => '');
    expect(textoTabela).not.toContain(atendenteInexistente);
    console.log(`✅ Busca por atendente inexistente (${atendenteInexistente}) validada com sucesso`);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
  });  
});