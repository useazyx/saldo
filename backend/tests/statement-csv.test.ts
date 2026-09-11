import { describe, expect, it } from "vitest"
import { withFingerprints } from "../src/utils/fingerprint.js"
import {
  EMPTY_STATEMENT,
  MISSING_COLUMNS,
  parseAmountCents,
  parseDate,
  parseStatementCsv,
} from "../src/utils/statementCsv.js"

describe("statement CSV parsing", () => {
  it("reads a Nubank credit card export and turns purchases into expenses", () => {
    const csv = ["date,title,amount", "2026-08-03,iFood *Restaurante,45.90", "2026-08-10,Pagamento recebido,-1200.00"].join("\n")

    const statement = parseStatementCsv(csv)

    expect(statement.format).toBe("nubank-card")
    expect(statement.rows).toEqual([
      { line: 2, occurred_on: "2026-08-03", description: "iFood *Restaurante", amount_cents: -4590 },
      { line: 3, occurred_on: "2026-08-10", description: "Pagamento recebido", amount_cents: 120000 },
    ])
  })

  it("reads a Nubank checking account export as is", () => {
    const csv = [
      "﻿Data,Valor,Identificador,Descrição",
      "01/08/2026,5000.00,abc-1,Transferência recebida - Empresa LTDA",
      "02/08/2026,-320.50,abc-2,Compra no débito - Supermercado",
    ].join("\r\n")

    const statement = parseStatementCsv(csv)

    expect(statement.format).toBe("nubank-account")
    expect(statement.rows.map((row) => row.amount_cents)).toEqual([500000, -32050])
    expect(statement.rows[1].occurred_on).toBe("2026-08-02")
  })

  it("reads a generic semicolon file with Brazilian numbers and reports bad lines", () => {
    const csv = [
      "Data Lançamento;Histórico;Valor (R$)",
      "05/08/2026;  Conta   de luz ;-R$ 1.234,56",
      "31/02/2026;Data impossível;-10,00",
      "06/08/2026;Valor estranho;abc",
      "07/08/2026;;-5,00",
    ].join("\n")

    const statement = parseStatementCsv(csv)

    expect(statement.format).toBe("generic")
    expect(statement.rows).toEqual([
      { line: 2, occurred_on: "2026-08-05", description: "Conta de luz", amount_cents: -123456 },
    ])
    expect(statement.errors.map((error) => error.line)).toEqual([3, 4, 5])
  })

  it("refuses files without the needed columns or without rows", () => {
    expect(() => parseStatementCsv("nome,idade\nAna,30")).toThrow(MISSING_COLUMNS)
    expect(() => parseStatementCsv("date,title,amount\n")).toThrow(EMPTY_STATEMENT)
  })

  it("understands the common amount and date formats", () => {
    expect(parseAmountCents("1.234,56")).toBe(123456)
    expect(parseAmountCents("1,234.56")).toBe(123456)
    expect(parseAmountCents("-45.9")).toBe(-4590)
    expect(parseAmountCents("(45,90)")).toBe(-4590)
    expect(parseAmountCents("1.234")).toBe(123400)
    expect(parseAmountCents("")).toBeNull()
    expect(parseDate("2026-08-31T10:00:00")).toBe("2026-08-31")
    expect(parseDate("31-08-2026")).toBe("2026-08-31")
    expect(parseDate("08/31/2026")).toBeNull()
  })
})

describe("transaction fingerprints", () => {
  it("keeps identical purchases on the same day apart and is stable across imports", () => {
    const coffee = { occurred_on: "2026-08-03", amount_cents: -900, description: "Café" }

    const first = withFingerprints([coffee, { ...coffee }, { ...coffee, amount_cents: -1000 }])
    const again = withFingerprints([coffee, { ...coffee }, { ...coffee, amount_cents: -1000 }])

    expect(new Set(first.map((row) => row.fingerprint)).size).toBe(3)
    expect(again.map((row) => row.fingerprint)).toEqual(first.map((row) => row.fingerprint))
  })
})
