/**
 * SpendingByCategoryService.ts - Pra onde o dinheiro foi (ou de onde veio) num mês
 * # Pra que serve?
 * - Somar os lançamentos do mês por categoria, só saídas ou só entradas
 * - Dar o tamanho de cada fatia (share) e deixar "sem categoria" como uma fatia própria
 * - Ordenar da maior pra menor, que é como o gráfico mostra
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { CategoryColor } from "../../config/defaultCategories.js"
import { prisma } from "../../config/prisma.js"
import { monthRange } from "../../utils/month.js"

export class SpendingByCategoryService {
  async execute(userId: string, month: string, kind: "income" | "expense") {
    const { start, end } = monthRange(month)

    const [groups, categories] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["category_id"],
        where: {
          user_id: userId,
          occurred_on: { gte: start, lt: end },
          amount_cents: kind === "expense" ? { lt: 0 } : { gt: 0 },
        },
        _sum: { amount_cents: true },
        _count: { _all: true },
      }),
      prisma.category.findMany({ where: { user_id: userId }, select: { id: true, name: true, color: true } }),
    ])

    const categoriesById = new Map(categories.map((category) => [category.id, category]))
    const grandTotal = groups.reduce((total, group) => total + Math.abs(group._sum.amount_cents ?? 0), 0)

    return groups
      .map((group) => {
        const totalCents = Math.abs(group._sum.amount_cents ?? 0)
        const category = group.category_id ? categoriesById.get(group.category_id) : null

        return {
          category: category ? { ...category, color: category.color as CategoryColor } : null,
          total_cents: totalCents,
          // Arredonda em 4 casas (0.1234 = 12,34%), que é mais do que o gráfico precisa
          share: grandTotal === 0 ? 0 : Math.round((totalCents / grandTotal) * 10_000) / 10_000,
          transactions_count: group._count._all,
        }
      })
      // Maior primeiro; no empate, categoria com nome antes de "sem categoria", e depois ordem alfabética
      .sort(
        (a, b) =>
          b.total_cents - a.total_cents ||
          Number(a.category === null) - Number(b.category === null) ||
          (a.category?.name ?? "").localeCompare(b.category?.name ?? "")
      )
  }
}
