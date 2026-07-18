import { test} from '@playwright/test';
import { loginCompleto } from '../../utils/loginCompleto';

test('Desempenho do login - tempo de resposta', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });      
  const inicio = Date.now();
  await loginCompleto(page);
  const fim = Date.now();

  const tempoResposta = fim - inicio;
  console.log(`⏱️Tempo de resposta do login: ${tempoResposta} ms`);  
  if (tempoResposta > 5000) {
    console.log('⚠️ Tempo acima do limite esperado');
  }  
});
