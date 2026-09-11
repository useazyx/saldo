/**
 * MonthSummaryService.ts - O resumo de um mês, comparado com o anterior
 * # Pra que serve?
 * - Entradas, saídas e saldo do mês e do mês anterior (pra dizer se melhorou ou piorou)
 * - Quantos lançamentos do mês ainda estão sem categoria (o que falta organizar)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { monthRange } from "../../utils/month.js"
import { MonthlyTrendService } from "./MonthlyTrendService.js"

export class MonthSummaryService {
  async execute(userId: string, month: string) {
    const { start, end } = monthRange(month)

    // Busca em paralelo: os dois meses (a evolução já sabe somar) e os sem categoria
    const monthlyTrendService = new MonthlyTrendService()
    const [[previous, current], uncategorizedCount] = await Promise.all([
      monthlyTrendService.execute(userId, month, 2),
      prisma.transaction.count({
        where: { user_id: userId, category_id: null, occurred_on: { gte: start, lt: end } },
      }),
    ])

    return { ...current, previous, uncategorized_count: uncategorizedCount }
  }
}
