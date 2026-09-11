/**
 * CreateTransactionService.ts - Lança um gasto ou entrada na mão
 * # Pra que serve?
 * - Registrar o que não vem no extrato (dinheiro vivo, um Pix que alguém devolveu...)
 * - Se não escolherem categoria, as regras tentam achar uma
 * - A digital começa com "manual:" e é única, então nunca bate com linha de CSV
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { randomUUID } from "node:crypto"
import { prisma } from "../../config/prisma.js"
import { buildCategoryMatcher } from "../../utils/categoryMatcher.js"
import { ensureAccountOwnership, ensureCategoryOwnership } from "./ownershipChecks.js"
import { presentTransaction, toDateColumn, TRANSACTION_SELECT } from "./transactionPresenter.js"

// O que a gente precisa pra lançar:
interface CreateTransactionRequest {
  user_id: string
  account_id: string
  occurred_on: string
  description: string
  amount_cents: number
  category_id?: string | null
  notes?: string | null
}

export class CreateTransactionService {
  async execute(data: CreateTransactionRequest) {
    await ensureAccountOwnership(data.account_id, data.user_id)
    if (data.category_id) await ensureCategoryOwnership(data.category_id, data.user_id)

    const categoryId = data.category_id ?? (await this.suggestCategory(data.user_id, data.description))

    const transaction = await prisma.transaction.create({
      data: {
        user_id: data.user_id,
        account_id: data.account_id,
        category_id: categoryId,
        occurred_on: toDateColumn(data.occurred_on),
        description: data.description,
        amount_cents: data.amount_cents,
        notes: data.notes ?? null,
        fingerprint: `manual:${randomUUID()}`,
      },
      select: TRANSACTION_SELECT,
    })

    return presentTransaction(transaction)
  }

  private async suggestCategory(userId: string, description: string) {
    const rules = await prisma.categoryRule.findMany({
      where: { user_id: userId },
      select: { pattern: true, category_id: true },
    })
    return buildCategoryMatcher(rules)(description)
  }
}
