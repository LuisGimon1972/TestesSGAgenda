import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';
import { empresasParaguai } from '../../utils/rucs-paraguai';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

function gerarRUC(): string {
  const empresaAleatoria = empresasParaguai[Math.floor(Math.random() * empresasParaguai.length)];
  return empresaAleatoria.ruc;
}
let rucValido= '';
test.describe('Cadastro completo - Usuário e empresa (preenchimento por objeto) - suporte Paraguai', () => {
  
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    for (const p of context.pages()) {
      try {
        await p.evaluate(() => localStorage.clear());
        await p.evaluate(() => sessionStorage.clear());
      } catch {}
    }
  });

  const timestamp = Date.now();
  const nomeUsuario = obterNomePessoaAleatorio();
  const usuario = nomeUsuario
    .split(' ')[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const emailUsuario = `${usuario}.${timestamp}@sgbr.com`;
  const senhaUsuario = '12345678';

  const razaoSocial = `Barbearia ${nomeUsuario}`;
  const fantasia = `Fantasia ${nomeUsuario.split(' ')[0]}`;
  let slug = `site-${nomeUsuario.split(' ').slice(0, 2).join(' ')}`+timestamp;  

  async function fecharCookiesSeAparecer(page: Page) {
    const btnGlobal = page.getByText(/Entendi|Aceitar|Aceito|OK|Concordo/i).first();
    if (await btnGlobal.isVisible().catch(() => false)) {
      try {
        await btnGlobal.click({ force: true, timeout: 3000 });
        console.log('✅ Fechou aviso de cookies');
      } catch {}
    }
  }

  async function clicarBotaoGravarAtual(page: Page) {
    await page.waitForTimeout(700);

    const botoes = page.locator('button:visible, .q-btn:visible, [role="button"]:visible');
    const count = await botoes.count();

    let clicado = false;
    for (let i = 0; i < count; i++) {
      const botao = botoes.nth(i);
      const texto = (await botao.innerText()).replace(/\s+/g, ' ').trim();
      if (/Guardar|Gravar|Salvar|Confirmar|Continuar/i.test(texto)) {
        await botao.scrollIntoViewIfNeeded();
        await expect(botao).toBeVisible();
        await botao.click({ force: true });
        clicado = true;
        break;
      }
    }

    if (!clicado) {
      throw new Error('Botão Guardar/Gravar visível não encontrado');
    }
  }

  async function preencherInputVisivel(page: Page, index: number, valor: string, nomeCampoDescricao: string) {
    const input = page.locator('input:visible, textarea:visible').nth(index);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click({ force: true });
    await input.fill('');
    await input.type(valor, { delay: 20 });
    console.log(`✅ ${nomeCampoDescricao}:  ${valor}`);
  }

  async function preencherCampoProximoAoLabel(page: Page, labelRegex: RegExp, valor: string, nomeCampoDescricao: string) {
    await expect(page.getByText(labelRegex).first()).toBeVisible({ timeout: 15000 });

    const inputHandle = await page.evaluateHandle(({ source, flags }) => {
      const regex = new RegExp(source, flags);
      const allElements = Array.from(document.querySelectorAll('body *'));
      let targetLabel: HTMLElement | null = null;

      for (const el of allElements) {
        if (regex.test(el.textContent || '') && window.getComputedStyle(el).display !== 'none') {
          const hasChildMatch = Array.from(el.children).some(child => regex.test(child.textContent || ''));
          if (!hasChildMatch) {
            targetLabel = el as HTMLElement;
            break;
          }
        }
      }

      if (!targetLabel) throw new Error(`Label geométrico não encontrado: ${source}`);
      const labelRect = targetLabel.getBoundingClientRect();

      const inputs = Array.from(document.querySelectorAll('input, textarea')) as HTMLElement[];
      const visibleInputs = inputs.filter(i => {
        const rect = i.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(i).visibility !== 'hidden' && !(i as HTMLInputElement).disabled;
      });

      const camposOrdenados = visibleInputs
        .filter(campo => campo.getBoundingClientRect().top >= labelRect.top - 10)
        .sort((a, b) => {
          const rectA = a.getBoundingClientRect();
          const rectB = b.getBoundingClientRect();
          const distanciaA = Math.abs(rectA.top - labelRect.bottom) + Math.abs(rectA.left - labelRect.left);
          const distanciaB = Math.abs(rectB.top - labelRect.bottom) + Math.abs(rectB.left - labelRect.left);
          return distanciaA - distanciaB;
        });

      if (camposOrdenados.length === 0) throw new Error(`Campo próximo ao label ${source} não encontrado`);
      return camposOrdenados[0];
    }, { source: labelRegex.source, flags: labelRegex.flags });

    try {
      await inputHandle.click({ force: true });
    } catch {

    }
    await inputHandle.fill(valor);

    await inputHandle.evaluate((node: any) => {
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    });

    await inputHandle.dispose();
    console.log(`✅ ${nomeCampoDescricao}:${valor}`);
  }
  
async function selecionarComboPorLabel(
  page: Page,
  labelRegex: RegExp,
  opcaoRegex: RegExp,
  nomeComboDescricao: string,
  opts?: { exact?: boolean; retries?: number }
) {
  const retries = opts?.retries ?? 2;
  const exact = opts?.exact ?? false;

  await expect(page.getByText(labelRegex).first()).toBeVisible({ timeout: 15000 });

  const comboHandle = await page.evaluateHandle(({ source, flags }) => {
    const regex = new RegExp(source, flags);
    const allElements = Array.from(document.querySelectorAll('body *'));
    let targetLabel: HTMLElement | null = null;
    for (const el of allElements) {
      if (regex.test(el.textContent || '') && window.getComputedStyle(el).display !== 'none') {
        const hasChildMatch = Array.from(el.children).some(child => regex.test(child.textContent || ''));
        if (!hasChildMatch) { targetLabel = el as HTMLElement; break; }
      }
    }
    if (!targetLabel) throw new Error(`Label de combo não encontrado: ${source}`);
    const labelRect = targetLabel.getBoundingClientRect();
    const combos = Array.from(document.querySelectorAll('.q-field, [role="combobox"], .select, .v-select')) as HTMLElement[];
    const visibleCombos = combos.filter(i => {
      const rect = i.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(i).visibility !== 'hidden';
    });
    const combosOrdenados = visibleCombos
      .filter(campo => campo.getBoundingClientRect().top >= labelRect.top - 10)
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        const distA = Math.abs(rectA.top - labelRect.bottom) + Math.abs(rectA.left - labelRect.left);
        const distB = Math.abs(rectB.top - labelRect.bottom) + Math.abs(rectB.left - labelRect.left);
        return distA - distB;
      });
    if (combosOrdenados.length === 0) throw new Error(`Combo próximo ao label ${source} não encontrado`);
    return combosOrdenados[0];
  }, { source: labelRegex.source, flags: labelRegex.flags });

  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await comboHandle.click({ force: true });
      await comboHandle.dispose();
      await page.waitForTimeout(400 + attempt * 200);

      const optionsLocator = page.locator('.q-menu .q-item, .q-portal .q-item, [role="option"], .q-item, .v-list-item');
      const candidates = exact
        ? optionsLocator.filter({ hasText: new RegExp(`^${opcaoRegex.source}$`, opcaoRegex.flags) })
        : optionsLocator.filter({ hasText: opcaoRegex });

      await candidates.first().waitFor({ state: 'visible', timeout: 6000 });
      const opcao = candidates.first();
      
      await opcao.scrollIntoViewIfNeeded().catch(() => {});
      const textoOpcao = (await opcao.innerText().catch(() => '')).trim();

      await opcao.click({ force: true });
      
      await page.waitForTimeout(500);
      
      console.log(`✅ ${nomeComboDescricao}: ${textoOpcao}`);

      return textoOpcao;
    } catch (e) {
      lastError = e;
      console.warn(`⚠️ Tentativa ${attempt + 1} falhou para ${nomeComboDescricao}: ${(e as Error).message}`);
      await page.waitForTimeout(300);
    }
  }

  throw new Error(`Falha ao selecionar ${nomeComboDescricao}: ${lastError?.message || lastError}`);
} 
 
 async function selecionarComboPorIndice(page: Page, index: number, opcao: RegExp): Promise<string> {
  const combo = page.locator('.q-field:visible').nth(index);
  await combo.waitFor({ state: 'visible', timeout: 30000 });
  await combo.click({ force: true });

  await page.waitForTimeout(800);

  const opcoes = page.locator('.q-menu:visible .q-item, .q-virtual-scroll__content .q-item, [role="option"]:visible, .q-portal .q-item');
  const count = await opcoes.count();

  let encontrada = false;
  let selecionadoTexto = '';

  for (let i = 0; i < count; i++) {
    const item = opcoes.nth(i);
    const textoRaw = await item.innerText().catch(() => '');
    const texto = textoRaw.replace(/\s+/g, ' ').trim();
    if (opcao.test(texto)) {      
      await item.scrollIntoViewIfNeeded().catch(() => {});
      await item.click({ force: true });
      selecionadoTexto = texto;
      encontrada = true;
      break;
    }
  }

  if (!encontrada) {
    console.error(`❌ Opção não encontrada no combo índice ${index}: ${opcao}`);
    throw new Error(`Opção não encontrada no combo: ${opcao}`);
  }
  
  await page.waitForTimeout(800);
  let texto = ''  
  texto = index === 2 ? 'País' : 'Moeda';
  console.log('✅' + ' ' +  texto, 'Selecionado(a):',selecionadoTexto);
  return selecionadoTexto;
}
  
  async function preencherRucParaguai(page: Page, rucValor?: string) {
    const valor = gerarRUC();
    rucValido = valor
    const labelRegexes = [/RUC/i, /Registro Único de Contribuyentes/i, /Registro Unico/i, /Registro Tributario/i, /Documento/i];
    let preenchido = false;

    for (const rx of labelRegexes) {
      try {
        await preencherCampoProximoAoLabel(page, rx, valor, 'RUC (Paraguai)');        
        preenchido = true;
        break;
      } catch {
        console.log(`✅ Não preencheu RUC com: ${valor}`);
      }
    }

    if (!preenchido) {
      const fallback = page.locator('input[placeholder*="ruc" i], input[aria-label*="ruc" i], input[name*="ruc" i]').first();
      if (await fallback.count() > 0) {
        await fallback.waitFor({ state: 'visible', timeout: 8000 });
        await fallback.fill('');
        await fallback.type(valor, { delay: 20 });
        await fallback.evaluate((node: any) => {
          node.dispatchEvent(new Event('input', { bubbles: true }));
          node.dispatchEvent(new Event('change', { bubbles: true }));
          node.dispatchEvent(new Event('blur', { bubbles: true }));
        });
        console.log(`✅ Preencheu RUC (fallback) com: ${valor}`);
        preenchido = true;
      }
    }

    if (!preenchido) throw new Error('Campo RUC não encontrado (nem por label nem por placeholder).');

    await page.waitForTimeout(900);

    const invalid = await page.locator('text=/no v[aá]lido|inv[aá]lido|RUC inválido|inválido/i').count();
    if (invalid > 0) throw new Error('Validação de RUC retornou inválido.');

    return valor;
  }

  async function preencherConfiguracaoSite(page: Page) {

    await expect(page.locator('body')).toHaveText(
      /Configura[çc][aã]o do site|Configuraci[oó]n del sitio|URL do site|URL del sitio/i,
      { timeout: 30000 }
    );
    console.log('✅ Abriu tela de Configuração do site');
    
    await page.waitForTimeout(1500);
   
    const inputSlug = page.locator('input[type="text"]:visible').first();
    await inputSlug.waitFor({ state: 'visible', timeout: 10000 });
    await inputSlug.click({ force: true });    
  
    await inputSlug.press('Control+A');
    await inputSlug.press('Backspace');
    await page.waitForTimeout(200);
    
    const slugFormatado = slug.replace(/\s+/g, '').toLowerCase();
    slug = slugFormatado;
    
    await inputSlug.pressSequentially(slugFormatado, { delay: 20 });    
    
    await inputSlug.evaluate((node: any) => {
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    
    await page.waitForTimeout(1000);
    console.log(`✅ Slug do site: ${slugFormatado}`);
    
    await selecionarComboPorLabel(page, /Segmento/i, /Barbearia|Barber[ií]a/i, 'Segmento');    
    
    await clicarBotaoGravarAtual(page);
    console.log('✅ Clicou em Gravar (Configuração do site)');
  }

  test('Deve cadastrar usuário, empresa e configuração inicial do site (suporte Paraguai).', async ({ page }) => {
    test.setTimeout(180000);

    await page.goto('/');
    console.log('✅ Abriu Site');
    await page.waitForTimeout(1500);
    await fecharCookiesSeAparecer(page);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (/Dashboard|Agenda|Clientes|Atendentes/i.test(bodyText) && !/Bem vindo|Entrar|Cadastre-se/i.test(bodyText)) {
      const perfilBtn = page.locator('button, .q-btn, [role="button"]').filter({ hasText: /keyboard_arrow_down|expand_more|@/i }).last();
      if (await perfilBtn.count() > 0) await perfilBtn.click({ force: true });
      await page.waitForTimeout(700);
      const btnSair = page.getByText(/^Sair$/i).first();
      if (await btnSair.count() > 0) await btnSair.click({ force: true });
      else { await page.context().clearCookies(); await page.goto('/'); }
    }

    await page.getByText(/Cadastre-se/i).first().waitFor({ state: 'visible', timeout: 30000 });
    await page.getByText(/Cadastre-se/i).first().click({ force: true });
    console.log('✅ Clicou em Cadastre-se');

    console.log(`✅ E-mail criado para cadastro: ${emailUsuario}`);
    await preencherInputVisivel(page, 0, nomeUsuario, 'Nome do Usuário');
    await preencherInputVisivel(page, 1, emailUsuario, 'E-mail do Usuário');
    await preencherInputVisivel(page, 2, senhaUsuario, 'Senha do Usuário');
    await preencherInputVisivel(page, 3, senhaUsuario, 'Confirmar Senha');

    await page.getByText(/^Gravar$/i).first().click({ force: true });
    console.log('✅ Clicou em Gravar (Cadastro de Usuário)');

    await expect(page.getByText(/Informa[çc][õo]es da empresa|Raz[aã]o social|Fantasia/i).first()).toBeVisible({ timeout: 30000 });
    console.log('✅ Abriu tela de Informações da Empresa');
    await page.waitForTimeout(2000);

    await preencherCampoProximoAoLabel(page, /Raz[aã]o social/i, razaoSocial, 'Razão Social');
    await preencherCampoProximoAoLabel(page, /Fantasia/i, fantasia, 'Nome Fantasia');    
    
    await selecionarComboPorIndice(page, 2, /Paraguay|Paraguai/i);
    await selecionarComboPorIndice(page, 3, /Guarani|Guaran[ií]s|PYG|₲|G\./i);
    
    const checkDocumento = await page.locator('body').innerText().catch(() => '');
    if (/Paraguai/i.test(checkDocumento) || /RUC/i.test(checkDocumento) || /Registro Unico/i.test(checkDocumento) || /Registro Único/i.test(checkDocumento)) {         
      try {
          await preencherRucParaguai(page);
          
      } catch (e) {
        console.error('❌ Falha ao preencher RUC:', (e as Error).message);
        throw e;
      }
    }   

    clicarBotaoGravarAtual(page)          
    console.log('✅ Clicou em Gravar (Empresa)');

    await page.waitForTimeout(800);
    await preencherConfiguracaoSite(page);

    await expect(page.getByText(/Dashboard|Agenda|Clientes|Bom dia|Boa tarde/i).first()).toBeVisible({ timeout: 30000 });
    console.log('✅ Acessou com sucesso o Dashboard / Tela Inicial');

    const caminhoArquivo = path.join(process.cwd(), 'test', 'usuarios', 'usuarios-gerados.json');

    const usuarioGerado: any = {
      dataCriacao: new Date().toISOString(),
      pais: 'Paraguai',
      nomeUsuario,
      emailUsuario,
      senhaUsuario,
      razaoSocial,
      fantasia,
      documento: rucValido,
      slug
    };

    let usuarios: any[] = [];
    try {
      if (fs.existsSync(caminhoArquivo)) usuarios = JSON.parse(fs.readFileSync(caminhoArquivo, 'utf-8') || '[]');
      usuarios.push(usuarioGerado);
      const diretorio = path.dirname(caminhoArquivo);
      if (!fs.existsSync(diretorio)) fs.mkdirSync(diretorio, { recursive: true });
      fs.writeFileSync(caminhoArquivo, JSON.stringify(usuarios, null, 2), 'utf-8');
      console.log(`✅ Usuário salvo com sucesso no JSON: ${emailUsuario}`);
    } catch (e) {
      console.error(`❌ Erro ao salvar arquivo JSON:`, e);
    }
   await capturarRequisicoesApi(page); 
   await page.waitForTimeout(4000);    
  });
});