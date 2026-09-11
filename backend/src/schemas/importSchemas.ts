/**
 * importSchemas.ts - O formato da importação de extrato
 * # Pra que serve?
 * - Validar em qual conta o extrato entra (o arquivo vem no multipart)
 * - Descrever a prévia, o resultado e o histórico
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { z } from "zod"
import { CATEGORY_COLOR_SCHEMA } from "./categorySchemas.js"

// Tamanho máximo do CSV: extrato de um ano inteiro cabe folgado
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024

export const IMPORT_QUERY_SCHEMA = z.object({
  account_id: z.uuid("account_id inválido"),
})

const ROW_ERROR_SCHEMA = z.object({ line: z.number().int(), message: z.string() })

export const IMPORT_PREVIEW_SCHEMA = z.object({
  format: z.enum(["nubank-card", "nubank-account", "generic"]),
  total_rows: z.number().int(),
  new_rows: z.number().int(),
  duplicate_rows: z.number().int(),
  errors: z.array(ROW_ERROR_SCHEMA),
  rows: z.array(
    z.object({
      line: z.number().int(),
      occurred_on: z.string(),
      description: z.string(),
      amount_cents: z.number().int(),
      category: z.object({ id: z.string(), name: z.string(), color: CATEGORY_COLOR_SCHEMA }).nullable(),
    })
  ),
})

const IMPORT_COUNTS = {
  id: z.string(),
  file_name: z.string(),
  total_rows: z.number().int(),
  imported_rows: z.number().int(),
  duplicate_rows: z.number().int(),
  skipped_rows: z.number().int(),
  created_at: z.string(),
}

export const IMPORT_RESULT_SCHEMA = z.object({ ...IMPORT_COUNTS, errors: z.array(ROW_ERROR_SCHEMA) })

export const IMPORT_HISTORY_ITEM_SCHEMA = z.object({
  ...IMPORT_COUNTS,
  account: z.object({ id: z.string(), name: z.string() }),
})

export type ImportQuery = z.infer<typeof IMPORT_QUERY_SCHEMA>
