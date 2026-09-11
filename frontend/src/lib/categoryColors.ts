import type { CategoryColor } from "./types"

// Ordem validada pra daltonismo: é a mesma do backend, e as cores vêm das variáveis do tema (claro/escuro)
export const CATEGORY_COLORS: CategoryColor[] = ["blue", "orange", "aqua", "yellow", "magenta", "green", "violet", "red"]

export const CATEGORY_COLOR_LABELS: Record<CategoryColor, string> = {
  blue: "Azul",
  orange: "Laranja",
  aqua: "Verde-água",
  yellow: "Amarelo",
  magenta: "Rosa",
  green: "Verde",
  violet: "Violeta",
  red: "Vermelho",
}

// null = sem categoria (cinza neutro)
export const categoryColorVar = (color: CategoryColor | null | undefined) =>
  `var(--color-cat-${color ?? "none"})`
