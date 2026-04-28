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

// Cliente simplificado - apenas contatos e fechados
export interface ClienteSimples {
  id: string
  data: string
  contatos: number
  fechados: number
  origem: string
}

export interface Ferramenta {
  id: string
  nome: string
  tipo: string
  valor: number
}

// Criativo para trafego pago
export interface Criativo {
  id: string
  data: string
  nome: string
  plataforma: string
  pessoasAlcancadas: number
  conversoes: number
  taxaConversao: number
}

// Historico mensal - snapshot de todos os dados do mes
export interface HistoricoMensal {
  id: string
  mes: number
  ano: number
  label: string // ex: "Janeiro 2026"
  dataFechamento: string
  resumo: {
    faturamentoTotal: number
    gastosTotal: number
    lucroLiquido: number
    investimentoTrafego: number
    vendasTrafego: number
    totalContatos: number
    totalFechados: number
    taxaConversao: number
  }
  receitas: Receita[]
  gastos: Gasto[]
  trafego: TrafegoPago[]
  vendasParceiros: VendaParceiro[]
  clientes: ClienteSimples[]
  criativos: Criativo[]
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
]

export const origensCliente = [
  'Trafego Pago',
  'Organico',
  'Indicacao',
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

export const mesesNomes = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]
