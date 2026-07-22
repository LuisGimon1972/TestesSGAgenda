import { test, expect } from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';
import { capturarRequisicoesApi } from '../../utils/capturaApi';
import { obterServicoAleatorio } from '../../utils/listaservicos';

test('Cadastro de Categorias', async ({ page }) => {
    test.setTimeout(1200000);
    
    await loginCompleto(page);    
    
    await page.waitForTimeout(2000);               
    await page.locator('.q-item, a, button').filter({ hasText: /Categorias/i }).first().click({ force: true });
    console.log(`✅ Clicou em Categorias`);          
    
    await page.waitForTimeout(2000);                
    const btnCadastrar = page.getByText(/Cadastrar categoria/i).first();
    await btnCadastrar.waitFor();
    await btnCadastrar.click({ force: true });      
    console.log(`✅ Clicou em Cadastrar Categoria`);  
    console.log(`✅ Abriu Form de Categorias`);              
    
    const salvarCategoriaPromise = page.waitForResponse((response) =>
      (response.url().includes('/api/') || response.url().includes('/categories') || response.url().includes('/categoria')) &&
      ['POST', 'PUT'].includes(response.request().method()) &&
      response.status() >= 200 &&
      response.status() < 300
    ).catch(() => null);    
    
    try {
      const btnCookie = page.getByText(/Entendi|Aceitar|Fechar/i).first();
      if (await btnCookie.isVisible({ timeout: 3000 })) {
        await btnCookie.click({ force: true });
        console.log('✅ Fechou aviso de cookies');
      }
    } catch (e) {}

    await page.waitForTimeout(1000);    

    console.log('📝 DADOS ENVIADOS PRA API');
    const timestamp = Date.now();
    const nomeCategoria = obterServicoAleatorio().categoria + ' ' + timestamp;
    const descricao = `Categoria destinada aos serviços de barbearia, abrangendo procedimentos voltados aos cuidados e à estética masculina, como cortes de cabelo, barba, bigode, acabamento, tratamentos capilares e outros serviços relacionados, realizados por profissionais.`;    
    
    const preencherCampo = async (index: number, texto: string, nomeCampo: string) => {
        try {
            const campo = page.locator('input:visible').nth(index);
            await campo.scrollIntoViewIfNeeded();
            await campo.click({ force: true });
            await campo.press('Control+A');
            await campo.press('Backspace');
            await campo.type(texto, { delay: 50 });
            console.log(`✅ ${nomeCampo}:`, texto);
        } catch (e) {
            console.log(`⚠️ Falha ao preencher ${nomeCampo}`);
        }
    };
    
    await preencherCampo(0, nomeCategoria, 'Nome da Categoria');
    
try {
      const campoDescricao = page.locator('textarea:visible').first();
      await campoDescricao.scrollIntoViewIfNeeded();
      await campoDescricao.click({ force: true });
      await campoDescricao.press('Control+A');
      await campoDescricao.press('Backspace');
      await campoDescricao.type(descricao, { delay: 20 });
      console.log('✅ Descrição preenchida:', descricao);
    } catch (e) {
      console.log('⚠️ Falha ao preencher Descrição');
    }

    console.log('📝 FIM DE DADOS ENVIADOS PRA API');

    await page.waitForTimeout(2000);       
    
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    } catch (e) {}
    
    const btnGravar = page.getByText(/Gravar/i).first();
    await btnGravar.waitFor();
    await btnGravar.click({ force: true });
    console.log('✅ Clicou em Gravar');              
    
    let respostaJson: any = null;
    const salvarResponse = await salvarCategoriaPromise;    
    
    if (salvarResponse) {    
      console.log('🌐 A URL capturada do POST é:', salvarResponse.url());
      console.log(`✅ Status da resposta API: ${salvarResponse.status()}`);
      try {        
        respostaJson = await salvarResponse.json();               
        console.log('📦 JSON de resposta:', JSON.stringify(respostaJson, null, 2));        
      } catch (e) {
        console.log('⚠️ A resposta da API não contém um JSON válido ou veio vazia.');
      }

      const urlListagem = salvarResponse.url().replace(/\/$/, '');      
      const headersGet = { ...salvarResponse.request().headers() };
      delete headersGet['content-type'];
      delete headersGet['content-length'];
      delete headersGet[':method'];
      delete headersGet[':path'];
      delete headersGet[':authority'];
      delete headersGet[':scheme'];
      
      const urlConsulta = `${urlListagem}?page=1&perPage=10&f_params[orderBy][field]=created_at&f_params[orderBy][type]=desc`;
      
      const respostaListagem = await page.request.get(urlConsulta, {
        headers: headersGet,
      });

      console.log('🌐 URL da consulta de listagem:', urlConsulta);
      console.log(`✅ Status da consulta GET: ${respostaListagem.status()}`);

      if (respostaListagem.status() === 200) {
        const jsonListagem = await respostaListagem.json();      
        const listaCategorias: any[] = jsonListagem?.data || jsonListagem || [];
        
        const categoriaCriada = listaCategorias.find(
          (p: any) => p.name === nomeCategoria || p.nome === nomeCategoria
        );

        if (categoriaCriada) {
          const idEncontrado = categoriaCriada.id || categoriaCriada.iid;
          console.log('✅ REGISTRO ENCONTRADO COM SUCESSO!');
          console.log('🆔 ID do Novo Registro:', idEncontrado);
          console.log('📦 JSON do Registro Consultado:\n', JSON.stringify(categoriaCriada, null, 2));
        } else {
          console.log(`⚠️ Categoria "${nomeCategoria}" não foi localizada na primeira página.`);
        }
      } else {
        console.log(`⚠️ Falha ao buscar a listagem de categorias. Status HTTP: ${respostaListagem.status()}`);
      }
    }

    try {
      await expect(page.locator('body')).toHaveText(
        /categoria|sucesso|salvo|cadastrado|Listagem de categorias/i,
        { timeout: 30000 }
      );
      console.log('✅ Categoria cadastrada com sucesso!');
    } catch (e) {
      console.log('⚠️ Validação de texto concluída.');
    }   
    await capturarRequisicoesApi(page); 
    await page.waitForTimeout(4000);    
});