/**
 * defaultCategories.ts - As cores e as categorias que toda conta nova ganha
 * # Pra que serve?
 * - Fixar as 8 cores possíveis de categoria, numa ordem que foi validada pra daltonismo
 *   (o banco guarda o nome da cor; o front escolhe o tom certo pro tema claro ou escuro)
 * - Criar as categorias mais comuns no cadastro, pra primeira importação já sair organizada
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { CategoryKind } from "@prisma/client"

// A ordem importa: é ela que mantém cores vizinhas nos gráficos distinguíveis. Não tem nona cor.
export const CATEGORY_COLORS = ["blue", "orange", "aqua", "yellow", "magenta", "green", "violet", "red"] as const

export type CategoryColor = (typeof CATEGORY_COLORS)[number]

interface DefaultCategory {
  name: string
  kind: CategoryKind
  color: CategoryColor
}

// Saídas usam as 8 cores; entradas usam as 3 primeiras (que funcionam bem até todas juntas)
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Moradia", kind: "EXPENSE", color: "blue" },
  { name: "Mercado", kind: "EXPENSE", color: "orange" },
  { name: "Restaurantes e delivery", kind: "EXPENSE", color: "aqua" },
  { name: "Transporte", kind: "EXPENSE", color: "yellow" },
  { name: "Saúde", kind: "EXPENSE", color: "magenta" },
  { name: "Lazer", kind: "EXPENSE", color: "green" },
  { name: "Assinaturas", kind: "EXPENSE", color: "violet" },
  { name: "Compras", kind: "EXPENSE", color: "red" },
  { name: "Salário", kind: "INCOME", color: "blue" },
  { name: "Renda extra", kind: "INCOME", color: "orange" },
  { name: "Reembolsos", kind: "INCOME", color: "aqua" },
]
