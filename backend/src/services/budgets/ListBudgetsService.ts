/**
 * ListBudgetsService.ts - Os orçamentos do mês e como cada um está indo
 * # Pra que serve?
 * - Somar o que saiu em cada categoria orçada no mês
 * - Dizer quanto sobra e a situação: ok, perto do limite (80%) ou estourou
 * - Os mais apertados vêm primeiro, que é o que a pessoa precisa ver
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { CategoryColor } from "../../config/defaultCategories.js"
import { prisma } from "../../config/prisma.js"
import { monthRange } from "../../utils/month.js"

// A partir de quanto do limite o orçamento fica em alerta
export const BUDGET_WARNING_SHARE = 0.8

export class ListBudgetsService {
  async execute(userId: string, month: string) {
    const { start, end } = monthRange(month)

    const budgets = await prisma.budget.findMany({
      where: { user_id: userId, month: start },
      select: { id: true, limit_cents: true, category: { select: { id: true, name: true, color: true } } },
    })

    if (budgets.length === 0) return []

    // Soma as saídas do mês só das categorias que têm orçamento
    const spending = await prisma.transaction.groupBy({
      by: ["category_id"],
      where: {
        user_id: userId,
        category_id: { in: budgets.map((budget) => budget.category.id) },
        occurred_on: { gte: start, lt: end },
        amount_cents: { lt: 0 },
      },
      _sum: { amount_cents: true },
    })
    const spentByCategory = new Map(spending.map((item) => [item.category_id, Math.abs(item._sum.amount_cents ?? 0)]))

    return budgets
      .map((budget) => {
        const spentCents = spentByCategory.get(budget.category.id) ?? 0
        const usedShare = Math.round((spentCents / budget.limit_cents) * 10_000) / 10_000

        return {
          id: budget.id,
          month,
          category: { ...budget.category, color: budget.category.color as CategoryColor },
          limit_cents: budget.limit_cents,
          spent_cents: spentCents,
          remaining_cents: budget.limit_cents - spentCents,
          used_share: usedShare,
          status: this.getStatus(usedShare),
        }
      })
      .sort((a, b) => b.used_share - a.used_share)
  }

  private getStatus(usedShare: number): "ok" | "warning" | "over" {
    if (usedShare > 1) return "over"
    if (usedShare >= BUDGET_WARNING_SHARE) return "warning"
    return "ok"
  }
}
