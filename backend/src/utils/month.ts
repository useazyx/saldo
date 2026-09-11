/**
 * month.ts - Conta com mês de calendário ("2026-08")
 * # Pra que serve?
 * - Saber onde um mês começa e termina (pra filtrar lançamentos pela data)
 * - Andar meses pra frente e pra trás sem se perder na virada do ano
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

export const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

// "2026-12" + 1 = "2027-01"
export function addMonths(month: string, amount: number): string {
  const [year, monthNumber] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1))
  return date.toISOString().slice(0, 7)
}

// Do dia 1 do mês (inclusivo) até o dia 1 do mês seguinte (exclusivo), no formato da coluna @db.Date
export function monthRange(month: string) {
  return {
    start: new Date(`${month}-01T00:00:00.000Z`),
    end: new Date(`${addMonths(month, 1)}-01T00:00:00.000Z`),
  }
}

// Lista de meses em ordem: listMonths("2026-08", 3) = ["2026-06", "2026-07", "2026-08"]
export function listMonths(until: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addMonths(until, index - count + 1))
}
