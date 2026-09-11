/**
 * ListCategoriesService.ts - Lista as categorias da pessoa
 * # Pra que serve?
 * - Mostrar saídas primeiro e entradas depois, cada grupo em ordem alfabética
 * - Contar quantos lançamentos usam cada categoria (pra saber o que dá pra apagar sem dó)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import type { CategoryColor } from "../../config/defaultCategories.js"

export class ListCategoriesService {
  async execute(userId: string) {
    const categories = await prisma.category.findMany({
      where: { user_id: userId },
      select: { id: true, name: true, kind: true, color: true, _count: { select: { transactions: true } } },
      // Enum no Postgres ordena pela ordem em que foi declarado (INCOME, EXPENSE), não pelo alfabeto.
      // Decrescente dá saídas primeiro, que é o que a tela quer.
      orderBy: [{ kind: "desc" }, { name: "asc" }],
    })

    return categories.map(({ _count, ...category }) => ({
      ...category,
      color: category.color as CategoryColor,
      transactions_count: _count.transactions,
    }))
  }
}
