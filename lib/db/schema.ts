import { pgTable, text, decimal, date, boolean, timestamp, integer } from 'drizzle-orm/pg-core'

// Workspace - identificador unico por link
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull().default('Minha Planilha'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

// Gastos
export const gastos = pgTable('gastos', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  descricao: text('descricao').notNull(),
  valor: decimal('valor', { precision: 10, scale: 2 }).notNull(),
  categoria: text('categoria').notNull(),
  data: date('data').notNull(),
  fixo: boolean('fixo').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Trafego Pago
export const trafego = pgTable('trafego', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  data: date('data').notNull(),
  plataforma: text('plataforma').notNull(),
  valorInvestido: decimal('valor_investido', { precision: 10, scale: 2 }).notNull(),
  conversas: integer('conversas').default(0),
  vendas: integer('vendas').default(0),
  faturamento: decimal('faturamento', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Parceiros
export const parceiros = pgTable('parceiros', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  nome: text('nome').notNull(),
  porcentagem: decimal('porcentagem', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Vendas de Parceiros
export const vendasParceiros = pgTable('vendas_parceiros', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  parceiroId: text('parceiro_id').notNull(),
  data: date('data').notNull(),
  valorTotal: decimal('valor_total', { precision: 10, scale: 2 }).notNull(),
  valorPagar: decimal('valor_pagar', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Criativos
export const criativos = pgTable('criativos', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  nome: text('nome').notNull(),
  data: date('data').notNull(),
  alcance: integer('alcance').default(0),
  conversoes: integer('conversoes').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Analise de Clientes
export const analiseClientes = pgTable('analise_clientes', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  data: date('data').notNull(),
  quantidadeCompras: integer('quantidade_compras').default(0),
  tipo: text('tipo').notNull(), // 'novo' | 'antigo'
  valorTotal: decimal('valor_total', { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Types
export type Workspace = typeof workspaces.$inferSelect
export type Gasto = typeof gastos.$inferSelect
export type Trafego = typeof trafego.$inferSelect
export type Parceiro = typeof parceiros.$inferSelect
export type VendaParceiro = typeof vendasParceiros.$inferSelect
export type Criativo = typeof criativos.$inferSelect
export type AnaliseCliente = typeof analiseClientes.$inferSelect
