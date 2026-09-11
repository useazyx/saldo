/**
 * ListImportsService.ts - O histórico de extratos importados
 * # Pra que serve?
 * - Mostrar cada importação com a conta e o placar (entraram, repetidos, pulados), mais recente primeiro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"

const MAX_HISTORY = 50

export class ListImportsService {
  async execute(userId: string) {
    const imports = await prisma.statementImport.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        file_name: true,
        total_rows: true,
        imported_rows: true,
        duplicate_rows: true,
        skipped_rows: true,
        created_at: true,
        account: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "desc" },
      take: MAX_HISTORY,
    })

    return imports.map((item) => ({ ...item, created_at: item.created_at.toISOString() }))
  }
}
