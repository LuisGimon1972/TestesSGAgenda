export type Produto = {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
};

export const listaProdutos: Produto[] = [
  ...Array.from({ length: 100 }).map((_, i) => {
    const prefixos = ['Smart', 'Pro', 'Ultra', 'Mini', 'Max', 'Eco', 'Mega'];
    const itens = ['Monitor 17 polegadas', 'Teclado sem fio ', 'Mouse sem  fio', 'Cadeira de escritorio', 'Headset', 'Webcam Megabites', 'Notebook Lazer', 'Tablet Generic', 'Impressora Toshiba', 'Roteador Intel'];
    const categorias = ['Hardware', 'Periféricos', 'Móveis', 'Acessórios'];
    
    return {
      id: `PROD-${(2000 + i)}`,
      nome: `${prefixos[i % prefixos.length]} ${itens[i % itens.length]} ${i + 1}`,
      preco: parseFloat((Math.random() * 5000 + 50).toFixed(2)),
      categoria: categorias[i % categorias.length]
    };
  })
];

export function obterProdutoAleatorio(): Produto {
  return listaProdutos[Math.floor(Math.random() * listaProdutos.length)];
}