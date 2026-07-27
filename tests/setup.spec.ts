import { test } from '@playwright/test';
import { loginCompleto, formatarDataHora } from '../utils/loginCompleto';
import { capturarRequisicoesApi } from '../utils/capturaApi';

test('Setup login', async ({ page }) => {  
  await loginCompleto(page);    
  console.log('✅ Autenticação feita com sucesso!');  
  await capturarRequisicoesApi(page);   
  console.log(`🕒 Finalização do teste: ${formatarDataHora(new Date())}`);   
});