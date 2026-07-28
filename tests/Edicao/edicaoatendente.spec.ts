import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';
import { capturarRequisicoesApi } from '../../utils/capturaApi';

test.describe('Atendentes - Editar atendente aleatório da lista', () => {

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

  test.beforeEach(async ({ page }) => {

    await loginCompleto(page);    

    await fecharCookiesSeAparecer(page);

    const menuAtendentes = page.getByText(/Atendentes/i).first();
    await expect(menuAtendentes).toBeVisible({ timeout: 30000 });
    await menuAtendentes.scrollIntoViewIfNeeded();
    await menuAtendentes.click({ force: true });   

    await expect(page.getByText(/Listagem de atendentes/i).first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(2000);   
  });

  test('Deve selecionar aleatoriamente um atendente da lista e abrir edição.', async ({ page }) => {
    const linhas = page.locator('tbody tr');

    await expect(linhas.first()).toBeVisible({ timeout: 30000 });

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 atendente').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const nomeAtendentee = (await linhaSelecionada.locator('td').nth(0).innerText()).trim();
    console.log(`✅ Atendente selecionado: ${nomeAtendentee}`);
    
    const btnAcoes = linhaSelecionada
      .locator('td')
      .last()
      .locator('[aria-label], button, .q-btn')
      .first();

    await btnAcoes.scrollIntoViewIfNeeded();
    await btnAcoes.click({ force: true });

    console.log('📝 DADOS ENVIADOS PRA API');
    
    const opcaoEditar = page.getByText(/Editar atendente/i).first();
    await expect(opcaoEditar).toBeVisible({ timeout: 10000 });
    await opcaoEditar.click({ force: true });    
    const nomeAtendente = obterNomePessoaAleatorio();        
    
const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
  try {
    const campo = page.locator('input:visible').nth(index);
    await campo.scrollIntoViewIfNeeded();
    await campo.click({ force: true });
    
    await campo.press('Control+A');
    await campo.press('Backspace');
    
    if (texto) {
      await campo.pressSequentially(texto, { delay: 50 });
    }

    if (index === 2 || index === 3) {
      console.log(`✅ ${nomeCampo}: ${Number(texto) / 100}%`);
    } else if (nomeCampo) {
      console.log(`${nomeCampo} ${texto}`);
    }
  } catch (e) {
    
  }
};

const nomeAtendenteLimpo = (nomeAtendente || '').trim();
await preencherCampo(1, '', '');
await preencherCampo(1, nomeAtendenteLimpo, '✅ Nome do Atendente Alterado:');
await preencherCampo(2, '4500', 'Comissão Serviços Alterado');
await preencherCampo(3, '5600', 'Comissão Produtos Alterado');

    await page.waitForTimeout(2000);       
    
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    } catch (e) {}
    console.log('📝 FIM DE DADOS ENVIADOS PRA API');

    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');              
    
    await expect(page.locator('body')).toHaveText(
      /Cadastrar atendente|Editar atendente|Nome completo|E-mail|Gravar/i,
      { timeout: 30000 }
    );

    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});