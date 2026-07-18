import { test } from '@playwright/test';
import { loginCompleto } from '../utils/loginCompleto';
import { capturarRequisicoesApi } from '../utils/capturaApi';

test('Setup login', async ({ page }) => {  
  await loginCompleto(page);    
  console.log('AUTENTICAÇÃO OK');  

  await capturarRequisicoesApi(page);   
});