/**
 * PreviewImportService.ts - Mostra o extrato antes de importar
 * # Pra que serve?
 * - Dizer quantas linhas são novas, quantas já existem e quais têm problema
 * - Mostrar a categoria que cada lançamento novo vai ganhar, sem salvar nada
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { AnalyzeStatementService } from "./AnalyzeStatementService.js"

// O que a gente precisa pra montar a prévia:
interface PreviewImportRequest {
  user_id: string
  account_id: string
  content: string
}

export class PreviewImportService {
  async execute(data: PreviewImportRequest) {
    const analyzeStatementService = new AnalyzeStatementService()
    const analysis = await analyzeStatementService.execute(data)

    const categories = await prisma.category.findMany({
      where: { user_id: data.user_id },
      select: { id: true, name: true, color: true },
    })
    const categoriesById = new Map(categories.map((category) => [category.id, category]))

    const newRows = analysis.rows.filter((row) => !row.duplicate)

    return {
      format: analysis.format,
      total_rows: analysis.rows.length + analysis.errors.length,
      new_rows: newRows.length,
      duplicate_rows: analysis.rows.length - newRows.length,
      errors: analysis.errors,
      rows: newRows.map((row) => ({
        line: row.line,
        occurred_on: row.occurred_on,
        description: row.description,
        amount_cents: row.amount_cents,
        category: row.category_id ? (categoriesById.get(row.category_id) ?? null) : null,
      })),
    }
  }
}
