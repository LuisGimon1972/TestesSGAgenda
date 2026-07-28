import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Agendamentos - Busca de serviços no cadastro', () => {

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

  async function abrirAgenda(page: Page) {
    const menuAgenda = page.getByText(/Agenda/i).first();
    await expect(menuAgenda).toBeVisible({ timeout: 30000 });
    await menuAgenda.scrollIntoViewIfNeeded();
    await menuAgenda.click({ force: true });

    await expect(page.getByText(/Listagem de agendamentos/i).first()).toBeVisible({ timeout: 30000 });
  }

  function extrairNomeServico(textoCard: string): string {
    return textoCard
      .replace(/\s+/g, ' ')
      .replace(/a?\s*partir\s*de.*$/i, '')
      .replace(/R\$\s*\d+[.,]?\d*/gi, '')
      .trim();
  }

  async function abrirCadastroAgendamento(page: Page) {
    await page.waitForTimeout(1500);
    const btnCadastrar = page.getByText(/Cadastrar agendamento/i).first();
    await expect(btnCadastrar).toBeVisible({ timeout: 30000 });
    await btnCadastrar.click({ force: true });

    await expect(page.getByText(/Escolha o servi[çc]o/i).first()).toBeVisible({ timeout: 30000 });

    await expect(page.locator('body')).toHaveText(
      /Buscar servi[çc]o por nome|Escolha o servi[çc]o/i,
      { timeout: 30000 }
    );
  }

  function normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  
  async function obterTextosCardsServicos(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div')).filter((el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
      });

      return divs
        .filter((card) => {
          const texto = (card.textContent || '').replace(/\s+/g, ' ').trim();
          const rect = card.getBoundingClientRect();

          const temTamanhoDeCard =
            rect.width >= 120 &&
            rect.width <= 300 &&
            rect.height >= 70 &&
            rect.height <= 180;

          const temValor = /R\$\s*\d+/i.test(texto);

          const naoEhContainer =
            !/Escolha o servi[çc]o|Buscar servi[çc]o|Exibir mais|Listagem de agendamentos/i.test(
              texto
            );

          return temTamanhoDeCard && temValor && texto.length > 0 && naoEhContainer;
        })
        .map((card) => (card.textContent || '').replace(/\s+/g, ' ').trim());
    });
  }

  async function campoBuscaServico(page: Page) {
    const inputs = page.locator('input:visible');
    await expect(inputs.first()).toBeVisible({ timeout: 30000 });

    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const placeholder = (await input.getAttribute('placeholder').catch(() => '')) || '';
      const ariaLabel = (await input.getAttribute('aria-label').catch(() => '')) || '';

      if (/buscar.*servi/i.test(`${placeholder} ${ariaLabel}`)) {
        return input;
      }
    }

    return inputs.first();
  }

  async function buscarServico(page: Page, texto: string) {
    const campo = await campoBuscaServico(page);
    await campo.click({ force: true });

    await campo.press('Control+A');
    await campo.press('Backspace');
    await page.waitForTimeout(300);

    if (texto) {
      await campo.pressSequentially(texto, { delay: 20 });
    }

    // Dispara eventos para suportar frameworks reativos (Vue/Quasar)
    await campo.evaluate((node: any) => {
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.waitForTimeout(1500);
  }

  async function limparInput(locator: import('@playwright/test').Locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ force: true });

  // 1. Seleção total e limpeza via teclado
  await locator.press('Control+A');
  await locator.press('Backspace');
  await locator.page().waitForTimeout(100);

  await locator.evaluate((node: HTMLInputElement) => {
    node.value = '';
    node.dispatchEvent(new Event('input', { bubbles: true }));
    node.dispatchEvent(new Event('change', { bubbles: true }));
    node.dispatchEvent(new Event('blur', { bubbles: true }));
  });

  await locator.page().waitForTimeout(300);
}
  

  async function limparBusca(page: Page) {
    const campo = await campoBuscaServico(page);
    await campo.click({ force: true });

    await campo.press('Control+A');
    await campo.press('Backspace');

    await campo.evaluate((node: any) => {
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.waitForTimeout(1200);
  }

 async function obterServicoExistenteDaTela(page: Page): Promise<string> {
  let nomesValidos: string[] = [];

  await expect.poll(async () => {
    const cardsTextos = await obterTextosCardsServicos(page);
    nomesValidos = Array.from(
      new Set(
        cardsTextos
          .map((texto) => extrairNomeServico(texto))
          .filter((nome) => nome && nome.length >= 2)
      )
    );

    return nomesValidos.length;
  }, {
    message: 'Aguardando o carregamento dos serviços disponíveis na tela de agendamento',
    timeout: 15000,
  }).toBeGreaterThan(0);

  const indiceAleatorio = Math.floor(Math.random() * nomesValidos.length);  
  
  const nomeServico = nomesValidos[indiceAleatorio]
    .replace(/edit_square|edit|delete|more_vert|visibility/gi, '')
    .trim();

  expect(nomeServico, 'O nome do serviço selecionado deve ser válido').toBeTruthy();

  console.log(`✅ Serviço escolhido da tela (${indiceAleatorio + 1} de ${nomesValidos.length}): "${nomeServico}"`);

  return nomeServico;
}

  async function validarFiltroExistente(page: Page, nomeServico: string) {
    const nomeNormalizado = normalizarTexto(nomeServico);

    await expect.poll(async () => {
      const cards = await obterTextosCardsServicos(page);
      if (cards.length === 0) return false;

      const cardsInvalidos = cards.filter((textoCard) => {
        const textoNormalizado = normalizarTexto(textoCard);
        return !textoNormalizado.includes(nomeNormalizado);
      });

      return cardsInvalidos.length === 0;
    }, {
      message: `Todos os cards de serviço visíveis devem conter o termo pesquisado: ${nomeServico}`,
      timeout: 10000,
    }).toBe(true);

    console.log(`✅ Filtro validado com sucesso para o serviço: ${nomeServico}`);
  }

  async function validarFiltroInexistente(page: Page) {
    await expect.poll(async () => {
      const cards = await obterTextosCardsServicos(page);
      return cards.length;
    }, {
      message: 'Não deve exibir serviços para busca inexistente',
      timeout: 10000,
    }).toBe(0);

    console.log('✅ Validação de busca inexistente concluída com sucesso (cards zerados)');
  }

  test.beforeEach(async ({ page }) => {
    await loginCompleto(page);
    await fecharCookiesSeAparecer(page);
    await abrirAgenda(page);
    await abrirCadastroAgendamento(page);
  });

  test('Deve filtrar um serviço existente e depois um serviço inexistente.', async ({ page }) => {
    await capturarRequisicoesApi(page); 
    const nomeServicoExistente = await obterServicoExistenteDaTela(page);
    
    await buscarServico(page, nomeServicoExistente);
    await validarFiltroExistente(page, nomeServicoExistente);
   
    await limparBusca(page);
    await capturarRequisicoesApi(page); 
   
    const servicoInexistente = `SERVICO_INEXISTENTE_AGENDAMENTO}`;
    await buscarServico(page, servicoInexistente);
    await validarFiltroInexistente(page);

    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);
  });

});