/**
 * ApplyRulesService.ts - Categoriza o que ficou sem categoria
 * # Pra que serve?
 * - Passar as regras em todos os lançamentos sem categoria da pessoa
 * - Nunca mexer em lançamento que já tem categoria (a escolha manual vale mais que a regra)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { buildCategoryMatcher } from "../../utils/categoryMatcher.js"

export class ApplyRulesService {
  async execute(userId: string) {
    const [rules, uncategorized] = await Promise.all([
      prisma.categoryRule.findMany({ where: { user_id: userId }, select: { pattern: true, category_id: true } }),
      prisma.transaction.findMany({
        where: { user_id: userId, category_id: null },
        select: { id: true, description: true },
      }),
    ])

    if (rules.length === 0 || uncategorized.length === 0) return { categorized: 0 }

    const matchCategory = this.groupByCategory(buildCategoryMatcher(rules), uncategorized)

    // Um update por categoria (e não um por lançamento), com category_id null no filtro por garantia
    const updates = [...matchCategory.entries()].map(([categoryId, transactionIds]) =>
      prisma.transaction.updateMany({
        where: { id: { in: transactionIds }, category_id: null },
        data: { category_id: categoryId },
      })
    )
    const results = await prisma.$transaction(updates)

    return { categorized: results.reduce((total, result) => total + result.count, 0) }
  }

  // Monta "categoria -> lançamentos que caem nela"
  private groupByCategory(
    match: (description: string) => string | null,
    transactions: { id: string; description: string }[]
  ) {
    const groups = new Map<string, string[]>()

    for (const transaction of transactions) {
      const categoryId = match(transaction.description)
      if (!categoryId) continue
      groups.set(categoryId, [...(groups.get(categoryId) ?? []), transaction.id])
    }

    return groups
  }
}
