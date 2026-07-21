export type Servico = {
  id: string;
  nomeServico: string;
  categoria: 'BARBEARIA' | 'CABELEIREIRO' | 'SPA';
  duracaoMinutos: number;
  precoSugerido: number;
};

export const servicos: Servico[] = [
  // --- BARBEARIA ---
  { id: '2001', nomeServico: 'Corte Masculino Tradicional', categoria: 'BARBEARIA', duracaoMinutos: 30, precoSugerido: 45 },
  { id: '2002', nomeServico: 'Corte Degradê / Fade', categoria: 'BARBEARIA', duracaoMinutos: 40, precoSugerido: 55 },
  { id: '2003', nomeServico: 'Barba Modelada com Toalha Quente', categoria: 'BARBEARIA', duracaoMinutos: 30, precoSugerido: 40 },
  { id: '2004', nomeServico: 'Barboterapia Completa', categoria: 'BARBEARIA', duracaoMinutos: 45, precoSugerido: 70 },
  { id: '2005', nomeServico: 'Combo Corte + Barba', categoria: 'BARBEARIA', duracaoMinutos: 60, precoSugerido: 85 },
  { id: '2006', nomeServico: 'Pigmentação de Barba', categoria: 'BARBEARIA', duracaoMinutos: 30, precoSugerido: 50 },
  { id: '2007', nomeServico: 'Pezinho / Acabamento', categoria: 'BARBEARIA', duracaoMinutos: 15, precoSugerido: 20 },
  { id: '2008', nomeServico: 'Corte Infantil Masculino', categoria: 'BARBEARIA', duracaoMinutos: 30, precoSugerido: 40 },
  { id: '2009', nomeServico: 'Selagem Masculina', categoria: 'BARBEARIA', duracaoMinutos: 50, precoSugerido: 90 },
  { id: '2010', nomeServico: 'Platinado / Nevou', categoria: 'BARBEARIA', duracaoMinutos: 120, precoSugerido: 150 },

  // --- CABELEIREIRO ---
  { id: '2011', nomeServico: 'Corte Feminino a Laser/Tesoura', categoria: 'CABELEIREIRO', duracaoMinutos: 50, precoSugerido: 90 },
  { id: '2012', nomeServico: 'Escova Modeladora e Lavagem', categoria: 'CABELEIREIRO', duracaoMinutos: 40, precoSugerido: 60 },
  { id: '2013', nomeServico: 'Coloração Raiz e Comprimento', categoria: 'CABELEIREIRO', duracaoMinutos: 90, precoSugerido: 180 },
  { id: '2014', nomeServico: 'Mechas / Luzes / Balayage', categoria: 'CABELEIREIRO', duracaoMinutos: 180, precoSugerido: 350 },
  { id: '2015', nomeServico: 'Hidratação Profunda Capilar', categoria: 'CABELEIREIRO', duracaoMinutos: 45, precoSugerido: 80 },
  { id: '2016', nomeServico: 'Reconstrução / Cauterização', categoria: 'CABELEIREIRO', duracaoMinutos: 60, precoSugerido: 120 },
  { id: '2017', nomeServico: 'Progressiva / Escova Definitiva', categoria: 'CABELEIREIRO', duracaoMinutos: 150, precoSugerido: 250 },
  { id: '2018', nomeServico: 'Botox Capilar', categoria: 'CABELEIREIRO', duracaoMinutos: 90, precoSugerido: 160 },
  { id: '2019', nomeServico: 'Penteado para Festas e Eventos', categoria: 'CABELEIREIRO', duracaoMinutos: 60, precoSugerido: 150 },
  { id: '2020', nomeServico: 'Design de Sobrancelhas', categoria: 'CABELEIREIRO', duracaoMinutos: 30, precoSugerido: 35 },

  // --- SPA & BEM-ESTAR ---
  { id: '2021', nomeServico: 'Massagem Relaxante Corporal', categoria: 'SPA', duracaoMinutos: 60, precoSugerido: 140 },
  { id: '2022', nomeServico: 'Massagem Modeladora / Drenagem', categoria: 'SPA', duracaoMinutos: 60, precoSugerido: 130 },
  { id: '2023', nomeServico: 'Limpeza de Pele Profunda', categoria: 'SPA', duracaoMinutos: 80, precoSugerido: 160 },
  { id: '2024', nomeServico: 'Massagem com Pedras Quentes', categoria: 'SPA', duracaoMinutos: 75, precoSugerido: 180 },
  { id: '2025', nomeServico: 'Reflexologia Podal', categoria: 'SPA', duracaoMinutos: 40, precoSugerido: 90 },
  { id: '2026', nomeServico: 'Esfoliação e Hidratação Corporal', categoria: 'SPA', duracaoMinutos: 60, precoSugerido: 150 },
  { id: '2027', nomeServico: 'Spa de Pés e Mãos', categoria: 'SPA', duracaoMinutos: 50, precoSugerido: 80 },
  { id: '2028', nomeServico: 'Banho de Ofurô com Aromaterapia', categoria: 'SPA', duracaoMinutos: 45, precoSugerido: 200 },
  { id: '2029', nomeServico: 'Peeling Facial Ultrassônico', categoria: 'SPA', duracaoMinutos: 60, precoSugerido: 190 },
  { id: '2030', nomeServico: 'Day Spa Relaxamento Total', categoria: 'SPA', duracaoMinutos: 180, precoSugerido: 450 }
];

/**
 * Retorna o nome de um serviço aleatório.
 */
export function obterNomeServicoAleatorio(): string {
  const servicoAleatorio = servicos[Math.floor(Math.random() * servicos.length)];
  return servicoAleatorio.nomeServico;
}

/**
 * Retorna o objeto completo de um serviço aleatório.
 */
export function obterServicoAleatorio(): Servico {
  return servicos[Math.floor(Math.random() * servicos.length)];
}