export interface Receita {
  id: string
  data: string
  cliente: string
  tipoServico: string
  valor: number
  formaPagamento: string
  origem: string
  observacoes?: string
}

export interface Gasto {
  id: string
  data: string
  categoria: string
  descricao: string
  valor: number
  fixo: boolean
}

export interface TrafegoPago {
  id: string
  data: string
  plataforma: string
  valorInvestido: number
  conversas: number
  custoConversa: number
  vendas: number
  faturamento: number
}

export interface Parceiro {
  id: string
  nome: string
  porcentagem: number
}

export interface VendaParceiro {
  id: string
  parceiroId: string
  data: string
  mensagens: number
  vendas: number
  valorTotal: number
  valorPagar: number
  status: 'pendente' | 'pago'
  dataPagamento?: string
}

export interface Cliente {
  id: string
  nome: string
  data: string
  valor: number
  status: 'pago' | 'pendente'
  origem: string
}

export interface Ferramenta {
  id: string
  nome: string
  tipo: string
  valor: number
}

export type CategoriaGasto = 
  | 'alimentacao'
  | 'lanche'
  | 'luz'
  | 'agua'
  | 'internet'
  | 'ferramentas'
  | 'programas'
  | 'outros'

export const categoriasGasto: { value: CategoriaGasto; label: string }[] = [
  { value: 'alimentacao', label: 'Alimentacao' },
  { value: 'lanche', label: 'Lanche da Tarde' },
  { value: 'luz', label: 'Luz' },
  { value: 'agua', label: 'Agua' },
  { value: 'internet', label: 'Internet' },
  { value: 'ferramentas', label: 'Ferramentas' },
  { value: 'programas', label: 'Programas/Softwares' },
  { value: 'outros', label: 'Outros' },
]

export const tiposServico = [
  'Arte',
  'Video',
  'Logo',
  'Identidade Visual',
  'Social Media',
  'Website',
  'Trafego Pago',
  'Outro',
]

export const formasPagamento = [
  'Pix',
  'Dinheiro',
  'Cartao de Credito',
  'Cartao de Debito',
  'Transferencia',
  'Boleto',
]

export const origensCliente = [
  'Trafego Pago',
  'Organico',
  'Parceiro',
  'Indicacao',
  'Redes Sociais',
]

export const plataformasTrafego = [
  'Meta Ads',
  'Google Ads',
  'TikTok Ads',
  'LinkedIn Ads',
]

export const tiposFerramenta = [
  'IA',
  'Edicao',
  'Design',
  'Trafego',
  'Gestao',
  'Comunicacao',
  'Outro',
]
