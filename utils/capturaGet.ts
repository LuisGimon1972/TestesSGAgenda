import { Page } from '@playwright/test';

export async function capturarRequisicaoApiGet(
  page: Page,
  endpoint: string
): Promise<{ resposta: any }> {
  return new Promise((resolve, reject) => {
    let respostaCapturada: any = null;

    page.on('response', async response => {
      if (response.request().method() === 'GET' && response.url().includes(endpoint)) {
        try {
          respostaCapturada = await response.json();
          const respostaLimpa = limparObjeto(respostaCapturada);
        //  console.log(
        //    `📥 RESPOSTA DA API [${response.status()}]:\n${JSON.stringify(respostaLimpa, null, 2)}`
       //   );
          resolve({ resposta: respostaLimpa });
        } catch (err) {
          reject('⚠️ Erro ao capturar resposta: ' + err);
        }
      }
    });

    setTimeout(() => {
      if (!respostaCapturada) {
        reject('⚠️ Nenhuma requisição GET capturada!');
      }
    }, 5000);
  });
}

function limparAnsi(texto: string): string {
  const regex = /\x1B\[[0-9;]*[A-Za-z]|[\x00-\x1F\x7F]/g;
  return texto.replace(regex, '');
}

function limparObjeto(obj: Record<string, unknown>): Record<string, unknown> {
  const limpo: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(obj)) {
    limpo[chave] = typeof valor === 'string' ? limparAnsi(valor) : valor;
  }
  return limpo;
}
