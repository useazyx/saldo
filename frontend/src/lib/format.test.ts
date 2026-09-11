import { describe, expect, it } from "vitest"
import {
  currentMonth,
  formatDate,
  formatMoney,
  formatMonth,
  formatShortMonth,
  formatSignedMoney,
  monthBounds,
  parseMoneyInput,
  shiftMonth,
} from "./format"

describe("format", () => {
  it("formats money in reais", () => {
    expect(formatMoney(123456)).toBe("R$ 1.234,56")
    expect(formatMoney(-4590)).toBe("-R$ 45,90")
    expect(formatSignedMoney(5000)).toBe("+R$ 50,00")
    expect(formatSignedMoney(-5000)).toBe("−R$ 50,00")
  })

  it("formats dates and months in Portuguese", () => {
    expect(formatDate("2026-08-03")).toBe("03/08/2026")
    expect(formatMonth("2026-08")).toBe("agosto de 2026")
    expect(formatShortMonth("2026-08")).toBe("ago")
  })

  it("moves across months and years", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12")
    expect(currentMonth(new Date(2026, 7, 31))).toBe("2026-08")
    expect(monthBounds("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" })
  })

  it("reads what people type as money", () => {
    expect(parseMoneyInput("R$ 1.234,56")).toBe(123456)
    expect(parseMoneyInput("45,9")).toBe(4590)
    expect(parseMoneyInput("-12.50")).toBe(-1250)
    expect(parseMoneyInput("abc")).toBeNull()
  })
})
