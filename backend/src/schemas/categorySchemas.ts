/**
 * categorySchemas.ts - O formato das categorias de entrada e saída
 * # Pra que serve?
 * - Validar criação e edição (a cor só pode ser uma das 8 da paleta)
 * - Descrever a categoria nas respostas, com quantos lançamentos usam ela
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { z } from "zod"
import { CATEGORY_COLORS } from "../config/defaultCategories.js"

export const CATEGORY_COLOR_SCHEMA = z.enum(CATEGORY_COLORS, "Cor precisa ser uma das cores da paleta")
export const CATEGORY_KIND_SCHEMA = z.enum(["INCOME", "EXPENSE"], "Tipo precisa ser INCOME ou EXPENSE")

const CATEGORY_NAME_SCHEMA = z.string().trim().min(2, "Nome da categoria precisa de pelo menos 2 letras").max(40)

export const CREATE_CATEGORY_BODY_SCHEMA = z.object({
  name: CATEGORY_NAME_SCHEMA,
  kind: CATEGORY_KIND_SCHEMA,
  color: CATEGORY_COLOR_SCHEMA,
})

// O tipo não muda depois de criado (senão orçamento e relatório antigos perdem o sentido)
export const UPDATE_CATEGORY_BODY_SCHEMA = z
  .object({ name: CATEGORY_NAME_SCHEMA, color: CATEGORY_COLOR_SCHEMA })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Manda pelo menos um campo pra alterar")

export const CATEGORY_SCHEMA = z.object({
  id: z.string(),
  name: z.string(),
  kind: CATEGORY_KIND_SCHEMA,
  color: CATEGORY_COLOR_SCHEMA,
  transactions_count: z.number().int(),
})

export type CreateCategoryBody = z.infer<typeof CREATE_CATEGORY_BODY_SCHEMA>
export type UpdateCategoryBody = z.infer<typeof UPDATE_CATEGORY_BODY_SCHEMA>
