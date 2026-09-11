/**
 * DeleteBudgetService.ts - Tira o orçamento de uma categoria
 * # Pra que serve?
 * - Remover o limite (os lançamentos não mudam em nada)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"

export const BUDGET_NOT_FOUND = "Orçamento não encontrado"

export class DeleteBudgetService {
  async execute(userId: string, budgetId: string) {
    const { count } = await prisma.budget.deleteMany({ where: { id: budgetId, user_id: userId } })

    if (count === 0) throw new Error(BUDGET_NOT_FOUND)
  }
}
