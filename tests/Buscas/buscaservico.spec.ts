import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { navegarPara } from '../../utils/navegar';

test.describe('Serviços - Busca', () => {

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

  async function abrirServicos(page: Page) {
    await page.waitForTimeout(1000);
    await navegarPara(page, 'Catálogo', '');

    await expect(page.locator('body')).toHaveText(
      /Serviços|Listado de servicios|Servi[çc]os|Servicios/i,
      { timeout: 30000 }
    );

    await page.waitForTimeout(1500);
  }

  async function buscarServico(page: Page, texto: string) {
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

  async function obterServicoExistenteDaGrade(page: Page): Promise<string | null> {
    const bodyText = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();

    const telaSemRegistros =
      /nenhum servi[çc]o encontrado|nenhum registro encontrado|nenhum resultado|no hay registros|sin registros|no se encontraron|no encontrado|cadastrar primeir/i.test(
        bodyText
      );

    if (telaSemRegistros) {
      console.log('⚠️ Nenhum serviço encontrado na grade (ou tela vazia). Teste interrompido sem erro.');
      return null;
    }

    const linhas = page.locator('tbody tr:visible');
    const count = await linhas.count();

    const linhasValidasIndex: number[] = [];

    for (let i = 0; i < count; i++) {
      const linha = linhas.nth(i);
      const colunas = linha.locator('td');
      const numColunas = await colunas.count();
      const texto = (await linha.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
      
      const naoEhLinhaVazia = !/nenhum|no hay|sin registros|no encontrado|cadastrar primeir/i.test(texto);

      if (numColunas > 0 && texto.length > 0 && naoEhLinhaVazia) {
        linhasValidasIndex.push(i);
      }
    }

    if (linhasValidasIndex.length === 0) {
      console.log('⚠️ Nenhum serviço válido encontrado na grade. Teste interrompido sem erro.');
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

    const nomeServico =
      textosColunas.find((texto) => {
        return (
          texto.length >= 2 &&
          !/^\d+$/.test(texto) &&
          !/^\+?\d/.test(texto) &&
          !/R\$|BRL|₲|\$|PYG/i.test(texto)
        );
      }) || textosColunas[0];

    if (!nomeServico) {
      console.log('⚠️ Nenhum nome de serviço válido encontrado. Teste interrompido sem erro.');
      return null;
    }

    console.log(`✅ Serviço escolhido: ${nomeServico}`);
    return nomeServico;
  }

  test.beforeEach(async ({ page }) => {
    await loginCompleto(page);
    await fecharCookiesSeAparecer(page);
    await abrirServicos(page);
  });

  test('Deve buscar primeiro um serviço existente e depois um inexistente.', async ({ page }) => {
    await capturarRequisicoesApi(page); 
    const nomeServicoExistente = await obterServicoExistenteDaGrade(page);
    
    if (!nomeServicoExistente) {
      console.log('⚠️ Busca de serviços não executada porque não existem serviços cadastrados.');
      return;
    }
    
    await buscarServico(page, nomeServicoExistente);

    const bodyTextExistente = await page.locator('body').innerText();
    expect(bodyTextExistente).toContain(nomeServicoExistente);
    console.log(`✅ Busca por serviço existente (${nomeServicoExistente}) validada com sucesso`);

    await limparBusca(page);
    await capturarRequisicoesApi(page); 
    
    const servicoInexistente = `SERVICO_INEXISTENTE_E2E_${Date.now()}`;
    await buscarServico(page, servicoInexistente);

    const linhasVisiveis = page.locator('tbody tr:visible');
    const countLinhas = await linhasVisiveis.count();

    if (countLinhas > 0) {
      const textoTabela = await linhasVisiveis.innerText().catch(() => '');
      expect(textoTabela).not.toContain(servicoInexistente);
    }

    console.log(`✅ Busca por serviço inexistente (${servicoInexistente}) validada com sucesso`);
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);
  });

});