'use server'

import { db } from '@/lib/db'
import { 
  workspaces, 
  gastos, 
  trafego, 
  parceiros, 
  vendasParceiros, 
  criativos, 
  analiseClientes 
} from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Gerar ID unico
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// ==================== WORKSPACE ====================

export async function getWorkspaceData(workspaceId: string, userId: string) {
  const result = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  
  if (result.length === 0) {
    // Workspace nao existe - criar novo para o usuario
    const newWorkspace = {
      id: workspaceId,
      nome: 'Minha Planilha',
      ownerId: userId,
    }
    await db.insert(workspaces).values(newWorkspace)
    return newWorkspace
  }
  
  const workspace = result[0]
  
  // Se o workspace nao tem dono, associar ao usuario atual
  if (!workspace.ownerId) {
    await db.update(workspaces).set({ ownerId: userId }).where(eq(workspaces.id, workspaceId))
    return { ...workspace, ownerId: userId }
  }
  
  // Verificar se o workspace pertence ao usuario
  if (workspace.ownerId !== userId) {
    return null
  }
  
  return workspace
}

export async function getOrCreateWorkspace(workspaceId: string) {
  const existing = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
  
  if (existing.length > 0) {
    return existing[0]
  }
  
  // Criar novo workspace
  const newWorkspace = {
    id: workspaceId,
    nome: 'Minha Planilha',
  }
  
  await db.insert(workspaces).values(newWorkspace)
  return newWorkspace
}

export async function createNewWorkspace() {
  const id = generateId()
  await db.insert(workspaces).values({ id, nome: 'Minha Planilha' })
  return id
}

// ==================== GASTOS ====================

export async function getGastos(workspaceId: string) {
  const result = await db.select().from(gastos).where(eq(gastos.workspaceId, workspaceId))
  return result.map(g => ({
    ...g,
    valor: Number(g.valor),
  }))
}

export async function addGasto(workspaceId: string, data: {
  descricao: string
  valor: number
  categoria: string
  data: string
  fixo: boolean
}) {
  const id = generateId()
  await db.insert(gastos).values({
    id,
    workspaceId,
    descricao: data.descricao,
    valor: data.valor.toString(),
    categoria: data.categoria,
    data: data.data,
    fixo: data.fixo,
  })
  revalidatePath(`/w/${workspaceId}`)
  return id
}

export async function updateGasto(workspaceId: string, id: string, data: {
  descricao: string
  valor: number
  categoria: string
  data: string
  fixo: boolean
}) {
  await db.update(gastos)
    .set({
      descricao: data.descricao,
      valor: data.valor.toString(),
      categoria: data.categoria,
      data: data.data,
      fixo: data.fixo,
    })
    .where(eq(gastos.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

export async function deleteGasto(workspaceId: string, id: string) {
  await db.delete(gastos).where(eq(gastos.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

// ==================== TRAFEGO ====================

export async function getTrafego(workspaceId: string) {
  const result = await db.select().from(trafego).where(eq(trafego.workspaceId, workspaceId))
  return result.map(t => ({
    ...t,
    valorInvestido: Number(t.valorInvestido),
    faturamento: Number(t.faturamento),
  }))
}

export async function addTrafego(workspaceId: string, data: {
  data: string
  plataforma: string
  valorInvestido: number
  conversas: number
  vendas: number
  faturamento: number
}) {
  const id = generateId()
  await db.insert(trafego).values({
    id,
    workspaceId,
    data: data.data,
    plataforma: data.plataforma,
    valorInvestido: data.valorInvestido.toString(),
    conversas: data.conversas,
    vendas: data.vendas,
    faturamento: data.faturamento.toString(),
  })
  revalidatePath(`/w/${workspaceId}`)
  return id
}

export async function updateTrafego(workspaceId: string, id: string, data: {
  data: string
  plataforma: string
  valorInvestido: number
  conversas: number
  vendas: number
  faturamento: number
}) {
  await db.update(trafego)
    .set({
      data: data.data,
      plataforma: data.plataforma,
      valorInvestido: data.valorInvestido.toString(),
      conversas: data.conversas,
      vendas: data.vendas,
      faturamento: data.faturamento.toString(),
    })
    .where(eq(trafego.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

export async function deleteTrafego(workspaceId: string, id: string) {
  await db.delete(trafego).where(eq(trafego.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

// ==================== PARCEIROS ====================

export async function getParceiros(workspaceId: string) {
  const result = await db.select().from(parceiros).where(eq(parceiros.workspaceId, workspaceId))
  return result.map(p => ({
    ...p,
    porcentagem: Number(p.porcentagem),
  }))
}

export async function addParceiro(workspaceId: string, data: {
  nome: string
  porcentagem: number
}) {
  const id = generateId()
  await db.insert(parceiros).values({
    id,
    workspaceId,
    nome: data.nome,
    porcentagem: data.porcentagem.toString(),
  })
  revalidatePath(`/w/${workspaceId}`)
  return id
}

export async function updateParceiro(workspaceId: string, id: string, data: {
  nome: string
  porcentagem: number
}) {
  await db.update(parceiros)
    .set({
      nome: data.nome,
      porcentagem: data.porcentagem.toString(),
    })
    .where(eq(parceiros.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

export async function deleteParceiro(workspaceId: string, id: string) {
  // Deletar vendas do parceiro tambem
  await db.delete(vendasParceiros).where(eq(vendasParceiros.parceiroId, id))
  await db.delete(parceiros).where(eq(parceiros.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

// ==================== VENDAS PARCEIROS ====================

export async function getVendasParceiros(workspaceId: string) {
  const result = await db.select().from(vendasParceiros).where(eq(vendasParceiros.workspaceId, workspaceId))
  return result.map(v => ({
    ...v,
    valorTotal: Number(v.valorTotal),
    valorPagar: Number(v.valorPagar),
  }))
}

export async function addVendaParceiro(workspaceId: string, data: {
  parceiroId: string
  data: string
  valorTotal: number
  valorPagar: number
}) {
  const id = generateId()
  await db.insert(vendasParceiros).values({
    id,
    workspaceId,
    parceiroId: data.parceiroId,
    data: data.data,
    valorTotal: data.valorTotal.toString(),
    valorPagar: data.valorPagar.toString(),
  })
  revalidatePath(`/w/${workspaceId}`)
  return id
}

export async function updateVendaParceiro(workspaceId: string, id: string, data: {
  parceiroId: string
  data: string
  valorTotal: number
  valorPagar: number
}) {
  await db.update(vendasParceiros)
    .set({
      parceiroId: data.parceiroId,
      data: data.data,
      valorTotal: data.valorTotal.toString(),
      valorPagar: data.valorPagar.toString(),
    })
    .where(eq(vendasParceiros.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

export async function deleteVendaParceiro(workspaceId: string, id: string) {
  await db.delete(vendasParceiros).where(eq(vendasParceiros.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

// ==================== CRIATIVOS ====================

export async function getCriativos(workspaceId: string) {
  return db.select().from(criativos).where(eq(criativos.workspaceId, workspaceId))
}

export async function addCriativo(workspaceId: string, data: {
  nome: string
  data: string
  alcance: number
  conversoes: number
}) {
  const id = generateId()
  await db.insert(criativos).values({
    id,
    workspaceId,
    nome: data.nome,
    data: data.data,
    alcance: data.alcance,
    conversoes: data.conversoes,
  })
  revalidatePath(`/w/${workspaceId}`)
  return id
}

export async function updateCriativo(workspaceId: string, id: string, data: {
  nome: string
  data: string
  alcance: number
  conversoes: number
}) {
  await db.update(criativos)
    .set({
      nome: data.nome,
      data: data.data,
      alcance: data.alcance,
      conversoes: data.conversoes,
    })
    .where(eq(criativos.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

export async function deleteCriativo(workspaceId: string, id: string) {
  await db.delete(criativos).where(eq(criativos.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

// ==================== ANALISE CLIENTES ====================

export async function getAnaliseClientes(workspaceId: string) {
  const result = await db.select().from(analiseClientes).where(eq(analiseClientes.workspaceId, workspaceId))
  return result.map(a => ({
    ...a,
    valorTotal: Number(a.valorTotal),
  }))
}

export async function addAnaliseCliente(workspaceId: string, data: {
  data: string
  quantidadeCompras: number
  tipo: 'novo' | 'antigo'
  valorTotal: number
}) {
  const id = generateId()
  await db.insert(analiseClientes).values({
    id,
    workspaceId,
    data: data.data,
    quantidadeCompras: data.quantidadeCompras,
    tipo: data.tipo,
    valorTotal: data.valorTotal.toString(),
  })
  revalidatePath(`/w/${workspaceId}`)
  return id
}

export async function updateAnaliseCliente(workspaceId: string, id: string, data: {
  data: string
  quantidadeCompras: number
  tipo: 'novo' | 'antigo'
  valorTotal: number
}) {
  await db.update(analiseClientes)
    .set({
      data: data.data,
      quantidadeCompras: data.quantidadeCompras,
      tipo: data.tipo,
      valorTotal: data.valorTotal.toString(),
    })
    .where(eq(analiseClientes.id, id))
  revalidatePath(`/w/${workspaceId}`)
}

export async function deleteAnaliseCliente(workspaceId: string, id: string) {
  await db.delete(analiseClientes).where(eq(analiseClientes.id, id))
  revalidatePath(`/w/${workspaceId}`)
}
