/**
 * UpsertBudgetService.ts - Define o limite de uma categoria num mês
 * # Pra que serve?
 * - Criar o orçamento ou trocar o limite se já existe (um por categoria por mês)
 * - Só categoria de saída da própria pessoa (orçamento de salário não faz sentido)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { monthRange } from "../../utils/month.js"
import { CATEGORY_NOT_FOUND } from "../categories/UpdateCategoryService.js"
import { ListBudgetsService } from "./ListBudgetsService.js"

export const BUDGET_NEEDS_EXPENSE_CATEGORY = "Orçamento só vale pra categoria de saída"

// O que a gente precisa pra definir:
interface UpsertBudgetRequest {
  user_id: string
  category_id: string
  month: string
  limit_cents: number
}

export class UpsertBudgetService {
  async execute({ user_id, category_id, month, limit_cents }: UpsertBudgetRequest) {
    await this.ensureExpenseCategory(category_id, user_id)

    const monthStart = monthRange(month).start

    // O índice único (categoria + mês) garante um orçamento só por categoria no mês
    await prisma.budget.upsert({
      where: { category_id_month: { category_id, month: monthStart } },
      update: { limit_cents },
      create: { user_id, category_id, month: monthStart, limit_cents },
    })

    // Devolve já com o gasto calculado, igual à listagem
    const listBudgetsService = new ListBudgetsService()
    const budgets = await listBudgetsService.execute(user_id, month)
    return budgets.find((budget) => budget.category.id === category_id)!
  }

  private async ensureExpenseCategory(categoryId: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, user_id: userId },
      select: { kind: true },
    })

    if (!category) throw new Error(CATEGORY_NOT_FOUND)
    if (category.kind !== "EXPENSE") throw new Error(BUDGET_NEEDS_EXPENSE_CATEGORY)
  }
}
