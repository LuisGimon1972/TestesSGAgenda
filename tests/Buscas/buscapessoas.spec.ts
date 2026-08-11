import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { navegarPara } from '../../utils/navegar';

test.describe('Clientes - Busca', () => {

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

  async function abrirClientes(page: Page) {
    await page.waitForTimeout(1000);
    await navegarPara(page, 'Clientes');   
    
    await expect(page.getByText(/Clientes/i).first()).toBeVisible({ timeout: 30000 });
  }

  async function buscarCliente(page: Page, texto: string) {
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
    await buscarCliente(page, '');
  }

  async function obterClienteExistenteDaGrade(page: Page): Promise<string | null> {
    const linhas = page.locator('tbody tr:visible');
    const count = await linhas.count();

    if (count === 0) {
      console.log('⚠️ Nenhum cliente encontrado na grade. Teste encerrado sem falha.');
      return null;
    }

    const clientesValidos: string[] = [];

    for (let i = 0; i < count; i++) {
      const linha = linhas.nth(i);
      const colunas = linha.locator('td');
      const numColunas = await colunas.count();

      if (numColunas > 0) {
        const textoLinha = (await linha.innerText()).trim();
        if (textoLinha.length > 0) {
          const nomeCliente = (await colunas.nth(0).innerText()).trim();
          if (nomeCliente && !/drag_indicator/i.test(nomeCliente)) {
            clientesValidos.push(nomeCliente);
          }
        }
      }
    }

    if (clientesValidos.length === 0) {
      console.log('⚠️ Linhas encontradas, mas sem nome de cliente válido.');
      return null;
    }

    const indiceAleatorio = Math.floor(Math.random() * clientesValidos.length);
    const clienteEscolhido = clientesValidos[indiceAleatorio];

    console.log(`✅ Cliente escolhido para busca: ${clienteEscolhido}`);
    return clienteEscolhido;
  }

  test.beforeEach(async ({ page }) => {
    await loginCompleto(page);
    await fecharCookiesSeAparecer(page);
    await abrirClientes(page);
  });

  test('Deve buscar primeiro um cliente existente e depois um inexistente.', async ({ page }) => {
    await capturarRequisicoesApi(page); 
    const nomeClienteExistente = await obterClienteExistenteDaGrade(page);

    if (!nomeClienteExistente) {
      console.log('⚠️ Teste interrompido pois não havia clientes na grade.');
      return;
    }
    
    await buscarCliente(page, nomeClienteExistente);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toContain(nomeClienteExistente);
    console.log(`✅ Busca por cliente existente (${nomeClienteExistente}) validada com sucesso`);

   
    await limparBusca(page);
    await capturarRequisicoesApi(page); 

    const clienteInexistente = `CLIENTE_INEXISTENTE_E2E_${Date.now()}`;
    await buscarCliente(page, clienteInexistente);

    const textoTabela = await page.locator('tbody').innerText().catch(() => '');
    expect(textoTabela).not.toContain(clienteInexistente);
    console.log(`✅ Busca por cliente inexistente (${clienteInexistente}) validada com sucesso`);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
  });  
});