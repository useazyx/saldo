/**
 * statementCsv.ts - Lê o CSV de extrato de banco e transforma em lançamentos
 * # Pra que serve?
 * - Achar as colunas de data, descrição e valor pelo nome do cabeçalho (cada banco chama de um jeito)
 * - Entender valor brasileiro ("R$ 1.234,56") e americano ("1234.56"), e data DD/MM/AAAA ou AAAA-MM-DD
 * - No CSV do cartão do Nubank a compra vem positiva: aqui ela vira saída (negativa)
 * - Linha com problema não derruba o arquivo: vira um erro com o número da linha
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import Papa from "papaparse"

export const EMPTY_STATEMENT = "Arquivo sem lançamentos"
export const MISSING_COLUMNS = "Não achei as colunas de data, descrição e valor"

export type StatementFormat = "nubank-card" | "nubank-account" | "generic"

// Um lançamento já entendido (a linha conta a partir do cabeçalho, que é a linha 1)
export interface StatementRow {
  line: number
  occurred_on: string
  description: string
  amount_cents: number
}

export interface StatementRowError {
  line: number
  message: string
}

export interface ParsedStatement {
  format: StatementFormat
  rows: StatementRow[]
  errors: StatementRowError[]
}

// Os nomes de coluna que cada banco usa (já em minúsculo e sem acento)
const HEADER_ALIASES = {
  date: ["data", "date", "data lancamento", "data da transacao", "data de lancamento"],
  description: ["descricao", "description", "title", "historico", "lancamento", "estabelecimento"],
  amount: ["valor", "amount", "value", "valor (r$)", "valor r$"],
}

// "Descrição " vira "descricao" (pra comparar sem se preocupar com acento, espaço ou maiúscula)
const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()

export function parseStatementCsv(content: string): ParsedStatement {
  // Tira o BOM que o Excel coloca no começo; o Papa descobre sozinho se o separador é vírgula ou ponto e vírgula
  const parsed = Papa.parse<string[]>(content.replace(/^﻿/, ""), { skipEmptyLines: "greedy" })
  const [headerRow, ...dataRows] = parsed.data

  if (!headerRow || dataRows.length === 0) throw new Error(EMPTY_STATEMENT)

  const headers = headerRow.map(normalizeText)
  const columns = findColumns(headers)
  const format = detectFormat(headers)

  const rows: StatementRow[] = []
  const errors: StatementRowError[] = []

  dataRows.forEach((cells, index) => {
    const line = index + 2
    const occurredOn = parseDate(cells[columns.date] ?? "")
    const amountCents = parseAmountCents(cells[columns.amount] ?? "")
    const description = (cells[columns.description] ?? "").replace(/\s+/g, " ").trim()

    if (!occurredOn) return errors.push({ line, message: `Data inválida: "${cells[columns.date] ?? ""}"` })
    if (amountCents === null) return errors.push({ line, message: `Valor inválido: "${cells[columns.amount] ?? ""}"` })
    if (!description) return errors.push({ line, message: "Lançamento sem descrição" })

    rows.push({
      line,
      occurred_on: occurredOn,
      description,
      // Cartão do Nubank: compra positiva é dinheiro saindo; pagamento negativo não é receita, é só a fatura sendo paga
      amount_cents: format === "nubank-card" ? -amountCents : amountCents,
    })
  })

  return { format, rows, errors }
}

function findColumns(headers: string[]) {
  const find = (aliases: string[]) => headers.findIndex((header) => aliases.includes(header))

  const columns = {
    date: find(HEADER_ALIASES.date),
    description: find(HEADER_ALIASES.description),
    amount: find(HEADER_ALIASES.amount),
  }

  if (columns.date < 0 || columns.description < 0 || columns.amount < 0) throw new Error(MISSING_COLUMNS)

  return columns
}

// O cartão do Nubank exporta exatamente date,title,amount; a conta exporta Data,Valor,Identificador,Descrição
function detectFormat(headers: string[]): StatementFormat {
  const joined = headers.join(",")
  if (joined === "date,title,amount") return "nubank-card"
  if (joined === "data,valor,identificador,descricao") return "nubank-account"
  return "generic"
}

// Aceita 31/08/2026, 31-08-2026 e 2026-08-31 (com ou sem hora depois). Devolve AAAA-MM-DD ou null.
export function parseDate(raw: string): string | null {
  const value = raw.trim()
  const brazilian = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/)
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)

  const [year, month, day] = brazilian
    ? [Number(brazilian[3]), Number(brazilian[2]), Number(brazilian[1])]
    : iso
      ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
      : [0, 0, 0]

  if (!year) return null

  // 31/02 não existe: se o Date "arrumar" a data, ela era inválida
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null

  return date.toISOString().slice(0, 10)
}

// "R$ 1.234,56" -> 123456 | "-45.90" -> -4590 | "(45,90)" -> -4590. Devolve centavos ou null.
export function parseAmountCents(raw: string): number | null {
  let value = raw.replace(/r\$/i, "").replace(/\s/g, "")
  if (!value) return null

  // Contabilidade escreve negativo entre parênteses
  const negativeByParentheses = /^\(.*\)$/.test(value)
  value = value.replace(/[()]/g, "")

  const lastComma = value.lastIndexOf(",")
  const lastDot = value.lastIndexOf(".")

  if (lastComma >= 0 && lastDot >= 0) {
    // Tem os dois: o que aparece por último é o separador decimal
    value = lastComma > lastDot ? value.replace(/\./g, "").replace(",", ".") : value.replace(/,/g, "")
  } else if (lastComma >= 0) {
    value = value.replace(",", ".")
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(value)) {
    // Só ponto com grupos de 3 dígitos (1.234 ou 1.234.567): é separador de milhar
    value = value.replace(/\./g, "")
  }

  if (!/^-?\d+(\.\d+)?$/.test(value)) return null

  const cents = Math.round(Number(value) * 100)
  return negativeByParentheses ? -Math.abs(cents) : cents
}
