export type Produto = {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
};

export const listaProdutos: Produto[] = [
  ...Array.from({ length: 100 }).map((_, i) => {
    const prefixos = ['Wella Professionals', 'Schwarzkopf Professional', 'Kérastase', 'Alfaparf Milano', 'Forever Liss', 'Joico', 'LOréal Professionnel'];
    const itens = ['Shampoo', 'Acondicionador', 'Crema de Cabelo', 'Máscara capilar', 'Pomada modeladora', 'Spray fixador', 'Ampolas de tratamento', 'Mousse', 'Tônico capilar', 'Gel fixador'];
    const categorias = ['Tonalizantes', 'Cuidados com a Pele', 'Manicure e Pedicure', 'Cabelo'];
    
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