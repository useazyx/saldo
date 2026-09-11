/**
 * ruleSchemas.ts - O formato das regras de categoria
 * # Pra que serve?
 * - Validar a regra "se a descrição contém X, a categoria é Y"
 * - Descrever a regra (com a categoria junto) e o resultado de aplicar as regras
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { z } from "zod"
import { CATEGORY_COLOR_SCHEMA } from "./categorySchemas.js"

export const CREATE_RULE_BODY_SCHEMA = z.object({
  pattern: z.string().trim().min(2, "O texto da regra precisa de pelo menos 2 letras").max(60),
  category_id: z.uuid("category_id inválido"),
  // Já categoriza o que foi importado antes e ficou sem categoria
  apply_to_existing: z.boolean().default(false),
})

export const RULE_SCHEMA = z.object({
  id: z.string(),
  pattern: z.string(),
  category: z.object({ id: z.string(), name: z.string(), color: CATEGORY_COLOR_SCHEMA }),
})

export const CREATED_RULE_SCHEMA = RULE_SCHEMA.extend({ categorized: z.number().int() })

export const APPLY_RULES_RESPONSE_SCHEMA = z.object({ categorized: z.number().int() })

export type CreateRuleBody = z.infer<typeof CREATE_RULE_BODY_SCHEMA>
