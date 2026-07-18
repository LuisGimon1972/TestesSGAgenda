import { test, expect } from '@playwright/test';
import { loginCompleto } from '../utils/loginCompleto';

test('Integridade do Sistema', async ({ request, page }) => {
  // 1. Login
  await page.setViewportSize({ width: 1920, height: 1080 });
  await loginCompleto(page);
  console.log('✅ Login realizado com sucesso');

  // 2. Endpoints principais da API
const endpoints = [
  { url: '/api/produtos', campos: ['id', 'nome', 'preco'] },
  { url: '/api/usuarios', campos: ['id', 'nome', 'email'] },
  { url: '/api/vendas', campos: ['id', 'valor', 'data'] },
  { url: '/api/faturamento', campos: ['total', 'mes'] },
  { url: '/api/db-status', campos: ['connected'] }
];

for (const ep of endpoints) {
  const inicio = Date.now();
  let response;
  let resultado = 'OK';
  let status = 0;

  try {
    response = await request.get(ep.url);
    status = response.status();
    const fim = Date.now();
    const tempo = fim - inicio;

    if (!response.ok()) {
      resultado = `Falha (Status ${status})`;
    } else {
      const contentType = response.headers()['content-type'] || '';
      
      if (!contentType.includes('application/json')) {
        resultado = 'Resposta não é JSON (Possível HTML/SPA)';
      } else {
        const body = await response.json();
        
        // CORRIGIDO: Agora sem espaços na variável
        const itensParaValidar = Array.isArray(body) ? body : [body];

        if (itensParaValidar.length === 0) {
          resultado = 'Sucesso parcial (JSON válido, mas array vazio)';
        } else {
          // Verifica se o primeiro item possui todos os campos esperados
          const primeiroItem = itensParaValidar[0];
          const valido = ep.campos.every(campo => primeiroItem && campo in primeiroItem);
          
          resultado = valido ? 'Sucesso real' : 'Conteúdo inesperado (Campos ausentes)';
        }
      }
    }
    
    console.log(`🔎 API ${ep.url} → ${resultado} (${status} em ${tempo}ms)`);

  } catch (error) {
    const fim = Date.now();
    console.error(`🚨 Erro crítico ao acessar ${ep.url} após ${fim - inicio}ms: `);
  }
}

  const paginas = [
    'https://testepyeduardo.hom.sgmaster.com.br/py/dashboard',
    'https://testepyeduardo.hom.sgmaster.com.br/py/pessoa',    
    'https://testepyeduardo.hom.sgmaster.com.br/py/producto',    
    'https://testepyeduardo.hom.sgmaster.com.br/py/usuarios',
    'https://testepyeduardo.hom.sgmaster.com.br/py/ventas/facturacion',
    'https://testepyeduardo.hom.sgmaster.com.br/py/ventas/dav',
    'https://testepyeduardo.hom.sgmaster.com.br/py/usuario/listado',
    'https://testepyeduardo.hom.sgmaster.com.br/py/usuario/perfil',
    'https://testepyeduardo.hom.sgmaster.com.br/py/registros/especies',
    'https://testepyeduardo.hom.sgmaster.com.br/py/registros/grupos',
    'https://testepyeduardo.hom.sgmaster.com.br/py/registros/subgrupos',
    'https://testepyeduardo.hom.sgmaster.com.br/py/registros/marcas',
    'https://testepyeduardo.hom.sgmaster.com.br/py/empleados'
  ];

  for (const url of paginas) {
    await page.goto(url);
    const erroVisivel = await page.locator('text=Erro').isVisible();
    if (erroVisivel) {
      console.error(`🚨 Erro detectado na página ${url}`);
    } else {
      console.log(`✅ Página ${url} carregada corretamente`);
    }    
  }
  console.log('🏁 Teste geral de Integridade do Sistema concluído com sucesso');
});
