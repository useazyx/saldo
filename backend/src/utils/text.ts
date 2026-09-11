/**
 * text.ts - Deixa texto comparável
 * # Pra que serve?
 * - "  UBER *Trip  São Paulo" e "uber *trip sao paulo" viram a mesma coisa
 * - Usado nas regras de categoria (a regra "ifood" tem que pegar "IFOOD *RESTAURANTE")
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

// Sem acento, minúsculo e com um espaço só entre as palavras
export const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
