/**
 * categoryMatcher.ts - Descobre a categoria de um lançamento pelas regras da pessoa
 * # Pra que serve?
 * - Aplicar "se a descrição contém X, a categoria é Y" sem ligar pra acento ou maiúscula
 * - Quando mais de uma regra serve, a mais específica ganha ("uber eats" antes de "uber")
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { normalizeText } from "./text.js"

export interface RuleForMatching {
  pattern: string
  category_id: string
}

// Ordena uma vez (padrão mais comprido primeiro) e devolve uma função rápida pra usar em cada linha
export function buildCategoryMatcher(rules: RuleForMatching[]) {
  const ordered = rules
    .map((rule) => ({ pattern: normalizeText(rule.pattern), category_id: rule.category_id }))
    .sort((a, b) => b.pattern.length - a.pattern.length)

  return (description: string): string | null => {
    const text = normalizeText(description)
    return ordered.find((rule) => text.includes(rule.pattern))?.category_id ?? null
  }
}
