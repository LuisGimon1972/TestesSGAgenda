import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';

test.describe('Cadastro completo - Usuário e empresa (preenchimento por objeto)', () => {
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
  const slug = `site-${nomeUsuario.split(' ').slice(0, 2).join(' ')}`;

  function gerarCnpjValido(): string {
    const base = `${Math.floor(10000000 + Math.random() * 90000000)}0001`;
    function calcularDigito(cnpjBase: string): string {
      const pesos = cnpjBase.length === 12
          ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
          : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const soma = cnpjBase.split('').reduce((total, num, i) => total + Number(num) * pesos[i], 0);
      const resto = soma % 11;
      return resto < 2 ? '0' : String(11 - resto);
    }
    const digito1 = calcularDigito(base);
    const digito2 = calcularDigito(base + digito1);
    return (base + digito1 + digito2).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  const cnpjValido = gerarCnpjValido();

  async function fecharCookiesSeAparecer(page: Page) {
    const btnGlobal = page.getByText(/Entendi|Aceitar|Aceito|OK|Concordo/i).first();
    if (await btnGlobal.isVisible().catch(() => false)) {
      try { 
        await btnGlobal.click({ force: true, timeout: 3000 }); 
        console.log('✅ Fechou aviso de cookies');
      } catch {}
    }
  }

  async function preencherInputVisivel(page: Page, index: number, valor: string, nomeCampoDescricao: string) {
    const input = page.locator('input:visible, textarea:visible').nth(index);
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.click({ force: true });
    await input.fill('');
    await input.type(valor, { delay: 20 });
    console.log(`✅ ${nomeCampoDescricao}: ${valor}`);
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

    await inputHandle.click({ force: true });
    await inputHandle.fill(valor);
    
    await inputHandle.evaluate((node: any) => {
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    
    await inputHandle.dispose();
    console.log(`✅ Preencheu campo de texto "${nomeCampoDescricao}" com "${valor}"`);
  }

  async function selecionarComboPorLabel(page: Page, labelRegex: RegExp, opcaoRegex: RegExp, nomeComboDescricao: string) {
    await expect(page.getByText(labelRegex).first()).toBeVisible({ timeout: 15000 });

    const comboHandle = await page.evaluateHandle(({ source, flags }) => {
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

      if (!targetLabel) throw new Error(`Label de combo não encontrado: ${source}`);
      const labelRect = targetLabel.getBoundingClientRect();

      const combos = Array.from(document.querySelectorAll('.q-field, [role="combobox"]')) as HTMLElement[];
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

    await comboHandle.click({ force: true });
    await comboHandle.dispose();

    await page.waitForTimeout(1200);

    const opcao = page.locator('.q-menu .q-item, .q-portal .q-item, [role="option"], .q-item').filter({ hasText: opcaoRegex }).first();
    await opcao.waitFor({ state: 'visible', timeout: 10000 });    
    
    const textoOpcao = await opcao.innerText().catch(() => opcaoRegex.toString());
    
    await opcao.click({ force: true });
    console.log(`✅ Selecionou o ${nomeComboDescricao}: ${textoOpcao.trim()}`);
    await page.waitForTimeout(800);
  }
  
  async function preencherConfiguracaoSite(page: Page) {
    await expect(page.getByText(/Configura[çc][ão] do site|URL do site/i).first()).toBeVisible({ timeout: 30000 });
    console.log('✅ Abriu tela de Configuração do site');
    await page.waitForTimeout(1500);
   
    const inputSlug = page.locator('input[type="text"]:visible').first();
    await inputSlug.waitFor({ state: 'visible', timeout: 10000 });
    await inputSlug.click({ force: true });
    await inputSlug.fill('');
    await inputSlug.type(slug, { delay: 20 });
    
    await inputSlug.evaluate((node: any) => {
      node.dispatchEvent(new Event('input', { bubbles: true }));
      node.dispatchEvent(new Event('change', { bubbles: true }));
      node.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    await page.waitForTimeout(1000);
    const slugFormatado = slug.replace(/\s+/g, '').toLowerCase();
    console.log(`✅ Preencheu o slug do site: ${slugFormatado}`);
    
    await selecionarComboPorLabel(page, /Segmento/i, /Barbearia/i, 'Segmento');
    
    await page.getByText(/^Gravar$/i).first().click({ force: true });
    console.log('✅ Clicou em Gravar (Configuração do site)');
  }  

  test('Deve cadastrar usuário, empresa e configuração inicial do site.', async ({ page }) => {
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
    await selecionarComboPorLabel(page, /Pa[ií]s/i, /Brasil/i, 'País');
    await selecionarComboPorLabel(page, /Moeda/i, /Real|R\$\s*-?\s*Real|Brasileiro/i, 'Moeda');

    const checkCnpj = await page.locator('body').innerText();
    if (/CNPJ/i.test(checkCnpj)) {
        await preencherCampoProximoAoLabel(page, /CNPJ/i, cnpjValido, 'CNPJ');
    }

    await page.getByText(/^Gravar$/i).first().click({ force: true });
    console.log('✅ Clicou em Gravar (Empresa)');
    
    await preencherConfiguracaoSite(page);
    
    await expect(page.getByText(/Dashboard|Agenda|Clientes|Bom dia|Boa tarde/i).first()).toBeVisible({ timeout: 30000 });
    console.log('✅ Acessou com sucesso o Dashboard / Tela Inicial');
    
    const caminhoArquivo = path.join(process.cwd(), 'test', 'usuarios', 'usuarios-gerados.json');    

    const usuarioGerado = { dataCriacao: new Date().toISOString(), pais: 'Brasil', nomeUsuario, emailUsuario, senhaUsuario, razaoSocial, fantasia, documento: cnpjValido, slug };
    
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
  });
});