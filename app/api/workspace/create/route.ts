import { createNewWorkspace } from '@/app/actions/data-actions'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const id = await createNewWorkspace()
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Erro ao criar workspace:', error)
    return NextResponse.json({ error: 'Erro ao criar workspace' }, { status: 500 })
  }
}
