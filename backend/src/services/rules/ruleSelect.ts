/**
 * ruleSelect.ts - Como uma regra sai da API
 * # Pra que serve?
 * - Buscar a regra já com a categoria (nome e cor), que é o que a tela mostra
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { Prisma } from "@prisma/client"
import type { CategoryColor } from "../../config/defaultCategories.js"

export const RULE_SELECT = {
  id: true,
  pattern: true,
  category: { select: { id: true, name: true, color: true } },
} satisfies Prisma.CategoryRuleSelect

export function presentRule(rule: Prisma.CategoryRuleGetPayload<{ select: typeof RULE_SELECT }>) {
  return { ...rule, category: { ...rule.category, color: rule.category.color as CategoryColor } }
}
