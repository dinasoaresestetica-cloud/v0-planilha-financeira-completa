// Funcoes utilitarias para manipulacao de datas sem problemas de timezone

/**
 * Extrai mes e ano de uma string de data no formato YYYY-MM-DD
 * Sem usar new Date() para evitar problemas de timezone
 */
export function getMonthYearFromDateString(dateString: string): { month: number; year: number } {
  const [year, month] = dateString.split('-').map(Number)
  return { month, year }
}

/**
 * Extrai dia, mes e ano de uma string de data no formato YYYY-MM-DD
 */
export function parseDateString(dateString: string): { day: number; month: number; year: number } {
  const [year, month, day] = dateString.split('-').map(Number)
  return { day, month, year }
}

/**
 * Formata uma string de data YYYY-MM-DD para DD/MM/YYYY
 * Sem conversao de timezone
 */
export function formatDateBR(dateString: string): string {
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Verifica se uma data pertence a um mes/ano especifico
 */
export function isInMonthYear(dateString: string, targetMonth: number, targetYear: number): boolean {
  const { month, year } = getMonthYearFromDateString(dateString)
  return month === targetMonth && year === targetYear
}

/**
 * Compara duas datas no formato YYYY-MM-DD para ordenacao
 * Retorna positivo se a > b, negativo se a < b, zero se iguais
 */
export function compareDates(a: string, b: string): number {
  return b.localeCompare(a) // Ordem decrescente (mais recente primeiro)
}
