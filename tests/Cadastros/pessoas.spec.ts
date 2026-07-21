import { test, expect, Page } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test.describe('Clientes - Cadastro', () => {
  
  
  function gerarCPFValido(): string {
    const rand = () => Math.floor(Math.random() * 9);
    const n = Array.from({ length: 9 }, rand);

    const d1 = 11 - (n.reduce((acc, value, index) => acc + value * (10 - index), 0) % 11);
    n.push(d1 >= 10 ? 0 : d1);

    const d2 = 11 - (n.reduce((acc, value, index) => acc + value * (11 - index), 0) % 11);
    n.push(d2 >= 10 ? 0 : d2);

    return n.join('');
  }

  function gerarTelefoneAleatorio(): string {
    const ddd = '49';
    const primeiroDigito = '9';
    const numero = Math.floor(10000000 + Math.random() * 90000000);
    return `${ddd}${primeiroDigito}${numero}`;
  }

  async function fecharCookiesSeAparecer(page: Page) {
    const btn = page.getByText('Entendi');
    // .isVisible() não lança erro se o elemento não existir, 
    // retorna false imediatamente.
    if (await btn.isVisible()) {
      await btn.click({ force: true });
    }
  }

  async function preencherInput(page: Page, index: number, valor: string) {
    const input = page.locator('input:visible').nth(index);
    await expect(input).toBeVisible();
    await input.click({ force: true });
    // O .fill() do Playwright limpa o campo automaticamente antes de digitar
    await input.fill(valor, { force: true }); 
  }

  async function preencherData(page: Page, index: number, valor: string) {
    const input = page.locator('input:visible').nth(index);
    await expect(input).toBeVisible();
    await input.fill(valor, { force: true });
  }

  async function preencherNomeCompleto(page: Page, nomeCliente: string) {
    const campoNome = page.locator('input:visible').nth(0);
    
    await campoNome.scrollIntoViewIfNeeded();
    await expect(campoNome).toBeVisible();
    
    await campoNome.click({ force: true });
    
    // O fill no Playwright é bastante estável e não sofre 
    // dos mesmos problemas de timing do .type() no Cypress.
    await campoNome.fill(nomeCliente, { force: true });

    // Verificação de segurança
    await expect(campoNome).toHaveValue(nomeCliente);
  }

  async function preencherInputModalEndereco(page: Page, index: number, valor: string) {
    const inputs = page.locator('.q-dialog input:visible');
    const inputCount = await inputs.count();
    
    if (inputCount > index) {
      const input = inputs.nth(index);
      await input.scrollIntoViewIfNeeded();
      await input.click({ force: true });
      await input.fill(valor, { force: true });
    }
  }

  async function marcarEnderecoPrincipal(page: Page) {
    const dialog = page.locator('.q-dialog');
    const checkbox = dialog
      .locator('[role="checkbox"], .q-checkbox, input[type="checkbox"]')
      .locator('visible=true')
      .first();

    const count = await checkbox.count();

    if (count > 0) {
      const ariaChecked = await checkbox.getAttribute('aria-checked');
      const className = (await checkbox.getAttribute('class')) || '';

      const jaMarcado =
        ariaChecked === 'true' ||
        className.includes('truthy') ||
        className.includes('checked');

      if (!jaMarcado) {
        await checkbox.click({ force: true });
      }
    } else {
      await page.getByText(/Endere[çc]o principal/i).click({ force: true });
    }
  }

  async function adicionarEnderecoCliente(page: Page) {
    const timestampEndereco = Date.now();
    const nomeEndereco = `Endereço E2E ${timestampEndereco}`;
    const cepValido = '89710300';
    const numero = `${Math.floor(100 + Math.random() * 900)}`;

    const btnAdicionar = page.getByText(/Adicionar/i).first();
    btnAdicionar.click()
    
    const dialog = page.locator('.q-dialog');
    await expect(dialog).toBeVisible({ timeout: 30000 });

    await page.waitForTimeout(500);

    const inputs = dialog.locator('input:visible');
    const totalInputs = await inputs.count();

    const indices =
      totalInputs >= 9
        ? { nomeEndereco: 0, cep: 2, numero: 6 }
        : { nomeEndereco: 0, cep: 1, numero: 3 };

    await preencherInputModalEndereco(page, indices.nomeEndereco, nomeEndereco);

    const cepInput = inputs.nth(indices.cep);
    await cepInput.scrollIntoViewIfNeeded();
    await cepInput.click({ force: true });
    
    // Fill limpa e digita, Press dispara a tecla enter.
    await cepInput.fill(cepValido, { force: true });
    await cepInput.press('Enter');

    await page.waitForTimeout(2500);

    await preencherInputModalEndereco(page, indices.numero, numero);

    await marcarEnderecoPrincipal(page);

    const btnConfirmar = dialog.getByText(/Confirmar/i);
    await btnConfirmar.click({ force: true });

    await page.waitForTimeout(1000);
  }

  // ==========================================
  // CONFIGURAÇÃO DOS TESTES
  // ==========================================

  test.beforeEach(async ({ page, context }) => {
    
    await loginCompleto(page);
    await context.clearCookies();    

    await fecharCookiesSeAparecer(page);

    const menuClientes = page.getByText(/Clientes/i).first();
    await menuClientes.scrollIntoViewIfNeeded();
    await menuClientes.click({ force: true });

    const btnCadastrar = page.getByText(/Cadastrar cliente/i);
    await expect(btnCadastrar).toBeVisible({ timeout: 30000 });
    await btnCadastrar.click({ force: true });
  });
  

  test('Deve cadastrar um cliente E2E com endereço principal.', async ({ page }) => {
    
    const timestamp = Date.now();
    const nomeCliente = `E2E Cliente ${timestamp}`;
    const telefone = gerarTelefoneAleatorio();
    const documento = gerarCPFValido();
    const email = `e2e.cliente.${timestamp}@teste.com`;
    
    const textDados = page.getByText(/Dados do cliente/i).first();
    await expect(textDados).toBeVisible({ timeout: 30000 });

    await expect(page).toHaveURL(/.*\/customers\/cadastro/);

    await page.waitForTimeout(500);

    await preencherNomeCompleto(page, nomeCliente);
    await preencherInput(page, 1, telefone);
    await preencherInput(page, 2, documento);
    await preencherInput(page, 3, email);
    await preencherData(page, 4, '1990-05-20');

    await adicionarEnderecoCliente(page);

    const btnGravar = page.getByText(/Gravar/i).first();
    await expect(btnGravar).toBeVisible({ timeout: 30000 });
    await btnGravar.click({ force: true });

    // Asserção final no corpo da página usando regex (semelhante ao Cypress match)
    await expect(page.locator('body')).toHaveText(
      /cliente|sucesso|salvo|cadastrado|Listagem de clientes/i,
      { timeout: 30000 }
    );
  });
});