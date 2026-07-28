import { test, expect, Page } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../../utils/loginCompleto';
import { obterNomePessoaAleatorio } from '../../utils/nomescompletos';

function gerarTelefoneAleatorio(): string {
  const ddd = '49';
  const primeiroDigito = '9';
  const numero = Math.floor(10000000 + Math.random() * 90000000);
  return `${ddd}${primeiroDigito}${numero}`;
}

test.describe('Clientes - Editar cliente aleatório da lista', () => {

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

    const menuClientes = page.getByText(/Clientes/i).first();
    await expect(menuClientes).toBeVisible({ timeout: 30000 });
    await menuClientes.scrollIntoViewIfNeeded();
    await menuClientes.click({ force: true });   

    await expect(page.getByText(/Listagem de clientes/i).first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
  });

  test('Deve selecionar aleatoriamente um cliente da lista e abrir edição.', async ({ page }) => {
    const linhas = page.locator('tbody tr');

    const totalLinhas = await linhas.count();
    expect(totalLinhas, 'A lista deve possuir ao menos 1 cliente').toBeGreaterThan(0);
    
    const indiceAleatorio = Math.floor(Math.random() * totalLinhas);
    const linhaSelecionada = linhas.nth(indiceAleatorio);

    const nomeClientee = (await linhaSelecionada.locator('td').first().innerText()).trim();
    console.log(`✅ Cliente selecionado: ${nomeClientee}`);    
    
    const btnEditar = linhaSelecionada
      .locator('button, a, i, .q-btn, .material-icons')
      .filter({ hasText: /edit/i })
      .first();
    
    await btnEditar.scrollIntoViewIfNeeded();
    await btnEditar.click({ force: true });
    
    await page.waitForTimeout(1000); 

    const timestamp = Date.now();
    const nomeCliente = obterNomePessoaAleatorio();
    const telefone = gerarTelefoneAleatorio();    
    const email = `cliente_email.${timestamp}@teste.com`;
    
    // Função infalível para limpar e preencher campos
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
      try {
        const campo = page.locator('input:visible').nth(index);       
        
        await campo.waitFor({ state: 'visible', timeout: 10000 });                              
        await campo.clear();        
        await page.waitForTimeout(100);
        
        if (texto) {        
          await campo.fill(texto); 
        }

        console.log(`✅ ${nomeCampo}: ${texto}`);
      } catch (e) {
        console.error(`❌ Falha ao tentar preencher o campo: ${nomeCampo}`, e);
      }
    };
    
    await preencherCampo(0, nomeCliente, 'Nome Completo Alterado');
    await preencherCampo(1, telefone, 'Telefone Alterado');
    await preencherCampo(3, email, 'Email Alterado');
    await preencherCampo(4, '1990-05-20', 'Data de Nascimento Alterada');

    await page.waitForTimeout(500);       

    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');                 
    
    await expect(page.locator('body')).toContainText(
      /Cliente salvo com sucesso/i,
      { timeout: 15000 }
    );
    
    console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);       
  });
});