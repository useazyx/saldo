/**
 * ConfirmImportService.ts - Importa o extrato de verdade
 * # Pra que serve?
 * - Registrar a importação e salvar os lançamentos novos, já categorizados, numa transação só
 * - skipDuplicates: se o mesmo arquivo for enviado duas vezes ao mesmo tempo, o índice único
 *   (conta + digital) segura a repetição e ela entra na contagem de repetidos
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { AnalyzeStatementService } from "./AnalyzeStatementService.js"

// O que a gente precisa pra importar:
interface ConfirmImportRequest {
  user_id: string
  account_id: string
  file_name: string
  content: string
}

export class ConfirmImportService {
  async execute({ user_id, account_id, file_name, content }: ConfirmImportRequest) {
    const analyzeStatementService = new AnalyzeStatementService()
    const analysis = await analyzeStatementService.execute({ user_id, account_id, content })

    const newRows = analysis.rows.filter((row) => !row.duplicate)
    const totalRows = analysis.rows.length + analysis.errors.length

    const statementImport = await prisma.$transaction(async (tx) => {
      const created = await tx.statementImport.create({
        data: {
          user_id,
          account_id,
          file_name,
          total_rows: totalRows,
          imported_rows: 0,
          duplicate_rows: 0,
          skipped_rows: analysis.errors.length,
        },
      })

      const { count } = await tx.transaction.createMany({
        data: newRows.map((row) => ({
          user_id,
          account_id,
          import_id: created.id,
          category_id: row.category_id,
          occurred_on: new Date(`${row.occurred_on}T00:00:00.000Z`),
          description: row.description,
          amount_cents: row.amount_cents,
          fingerprint: row.fingerprint,
        })),
        skipDuplicates: true,
      })

      // Repetido = tudo que era válido e não entrou (já existia antes ou chegou junto por outro envio)
      return tx.statementImport.update({
        where: { id: created.id },
        data: { imported_rows: count, duplicate_rows: analysis.rows.length - count },
      })
    })

    return {
      id: statementImport.id,
      file_name: statementImport.file_name,
      total_rows: statementImport.total_rows,
      imported_rows: statementImport.imported_rows,
      duplicate_rows: statementImport.duplicate_rows,
      skipped_rows: statementImport.skipped_rows,
      created_at: statementImport.created_at.toISOString(),
      errors: analysis.errors,
    }
  }
}
