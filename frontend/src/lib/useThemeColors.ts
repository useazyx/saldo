import { useEffect, useState } from "react"
import type { CategoryColor } from "./types"

// SVG não entende var() no atributo fill, então o gráfico precisa das cores já resolvidas.
// Os valores de fallback são os do tema claro (usados também nos testes, onde não tem CSS).
const FALLBACK = {
  ink: "#0b0b0b",
  inkSecondary: "#52514e",
  inkMuted: "#6f6d68",
  grid: "#e1e0d9",
  surface: "#fcfcfb",
  income: "#2a78d6",
  expense: "#eb6834",
  none: "#9a9892",
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#4a3aa7",
  red: "#e34948",
}

export type ThemeColors = typeof FALLBACK

const VARIABLES: Record<keyof ThemeColors, string> = {
  ink: "--color-ink",
  inkSecondary: "--color-ink-secondary",
  inkMuted: "--color-ink-muted",
  grid: "--color-grid",
  surface: "--color-surface",
  // Entradas e saídas nos gráficos usam os dois primeiros matizes da paleta (não as cores de status)
  income: "--color-cat-blue",
  expense: "--color-cat-orange",
  none: "--color-cat-none",
  blue: "--color-cat-blue",
  orange: "--color-cat-orange",
  aqua: "--color-cat-aqua",
  yellow: "--color-cat-yellow",
  magenta: "--color-cat-magenta",
  green: "--color-cat-green",
  violet: "--color-cat-violet",
  red: "--color-cat-red",
}

function readColors(): ThemeColors {
  if (typeof window === "undefined") return FALLBACK
  const style = getComputedStyle(document.documentElement)
  const entries = Object.entries(VARIABLES).map(([key, variable]) => {
    const value = style.getPropertyValue(variable).trim()
    return [key, value || FALLBACK[key as keyof ThemeColors]]
  })
  return Object.fromEntries(entries) as ThemeColors
}

export function useThemeColors() {
  const [colors, setColors] = useState(readColors)

  // Trocou o tema do sistema (claro/escuro): lê as cores de novo
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)")
    if (!media) return
    const update = () => setColors(readColors())
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return colors
}

export const colorForCategory = (colors: ThemeColors, color: CategoryColor | null | undefined) =>
  color ? colors[color] : colors.none
