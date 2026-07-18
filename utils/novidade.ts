import { Page } from '@playwright/test';

export async function fecharPopupAtualizacao(page: Page) {
  const popupTexto = page.locator('text=¡Novedad en camino!');
  if (await popupTexto.isVisible()) {
    console.log('Popup detectado, tentando fechar...');

    // Testa múltiplos seletores comuns de botão fechar
    const botaoFechar = page.locator(
      '[aria-label="Close"], .close, .modal-close, .btn-close, button:has(svg)'
    );

    if (await botaoFechar.isVisible()) {
      await botaoFechar.first().click().catch(() => {});
      console.log('Popup fechado com sucesso.');
    } else {
      console.log('Botão de fechar não encontrado, tentando clicar fora...');
      await page.mouse.click(10, 10); // fallback
    }
  }
}
