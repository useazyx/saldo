/**
 * fingerprint.ts - A "digital" de cada lançamento, pra reimportar sem duplicar
 * # Pra que serve?
 * - Gerar um hash a partir de data, valor e descrição
 * - Contar repetições dentro do mesmo arquivo: dois cafés iguais no mesmo dia são dois lançamentos,
 *   e importar o arquivo de novo gera exatamente as mesmas digitais (então nada entra duplicado)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { createHash } from "node:crypto"

interface FingerprintInput {
  occurred_on: string
  amount_cents: number
  description: string
}

export function withFingerprints<T extends FingerprintInput>(rows: T[]): (T & { fingerprint: string })[] {
  const occurrences = new Map<string, number>()

  return rows.map((row) => {
    const key = `${row.occurred_on}|${row.amount_cents}|${row.description.toLowerCase()}`
    const occurrence = (occurrences.get(key) ?? 0) + 1
    occurrences.set(key, occurrence)

    const fingerprint = createHash("sha256").update(`${key}|${occurrence}`).digest("hex")
    return { ...row, fingerprint }
  })
}
