/**
 * AnalyzeStatementService.ts - Lê um extrato e diz o que vai acontecer se importar
 * # Pra que serve?
 * - Conferir que a conta é da pessoa e ler o CSV
 * - Marcar o que já existe na conta (mesma digital) como repetido
 * - Sugerir a categoria de cada linha pelas regras
 * - É a base da prévia e da importação de verdade (as duas veem exatamente a mesma análise)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { buildCategoryMatcher } from "../../utils/categoryMatcher.js"
import { withFingerprints } from "../../utils/fingerprint.js"
import { parseStatementCsv } from "../../utils/statementCsv.js"
import { ACCOUNT_NOT_FOUND } from "../accounts/RenameAccountService.js"

export const TOO_MANY_ROWS = "Arquivo com lançamentos demais"
export const MAX_IMPORT_ROWS = 5000

// O que a gente precisa pra analisar:
interface AnalyzeStatementRequest {
  user_id: string
  account_id: string
  content: string
}

export class AnalyzeStatementService {
  async execute({ user_id, account_id, content }: AnalyzeStatementRequest) {
    await this.ensureAccountBelongsToUser(account_id, user_id)

    const statement = parseStatementCsv(content)
    if (statement.rows.length > MAX_IMPORT_ROWS) throw new Error(TOO_MANY_ROWS)

    const rows = withFingerprints(statement.rows)

    // Busca em paralelo: o que já existe na conta e as regras da pessoa
    const [existing, rules] = await Promise.all([
      prisma.transaction.findMany({
        where: { account_id, fingerprint: { in: rows.map((row) => row.fingerprint) } },
        select: { fingerprint: true },
      }),
      prisma.categoryRule.findMany({ where: { user_id }, select: { pattern: true, category_id: true } }),
    ])

    const existingFingerprints = new Set(existing.map((transaction) => transaction.fingerprint))
    const matchCategory = buildCategoryMatcher(rules)

    return {
      format: statement.format,
      errors: statement.errors,
      rows: rows.map((row) => ({
        ...row,
        duplicate: existingFingerprints.has(row.fingerprint),
        category_id: matchCategory(row.description),
      })),
    }
  }

  private async ensureAccountBelongsToUser(accountId: string, userId: string) {
    const account = await prisma.account.findFirst({ where: { id: accountId, user_id: userId }, select: { id: true } })
    if (!account) throw new Error(ACCOUNT_NOT_FOUND)
  }
}
