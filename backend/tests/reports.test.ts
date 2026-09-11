import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { addMonths, listMonths, monthRange } from "../src/utils/month.js"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

describe("reports", () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDatabase()
  })

  // Julho e agosto de 2026, com um lançamento sem categoria em agosto e um de setembro que não entra
  async function setup() {
    const person = await createUserAndLogin(app)
    const account = await prisma.account.create({ data: { user_id: person.user.id, name: "Nubank" } })
    const categories = await prisma.category.findMany({ where: { user_id: person.user.id } })
    const category = (name: string) => categories.find((item) => item.name === name)!.id

    let counter = 0
    const row = (date: string, amount: number, categoryName: string | null) => ({
      user_id: person.user.id,
      account_id: account.id,
      occurred_on: new Date(`${date}T00:00:00.000Z`),
      description: `Lançamento ${++counter}`,
      amount_cents: amount,
      fingerprint: String(counter),
      category_id: categoryName ? category(categoryName) : null,
    })

    await prisma.transaction.createMany({
      data: [
        row("2026-07-05", 600000, "Salário"),
        row("2026-07-10", -150000, "Moradia"),
        row("2026-08-01", 650000, "Salário"),
        row("2026-08-02", 20000, "Reembolsos"),
        row("2026-08-10", -180000, "Moradia"),
        row("2026-08-12", -40000, "Mercado"),
        row("2026-08-20", -10000, "Mercado"),
        row("2026-08-31", -70000, null),
        row("2026-09-01", -99999, "Lazer"),
      ],
    })

    return person
  }

  const get = (token: string, url: string) => app.inject({ method: "GET", url, headers: authHeader(token) })

  it("summarizes a month next to the previous one", async () => {
    const { token } = await setup()

    const response = await get(token, "/reports/summary?month=2026-08")

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      month: "2026-08",
      income_cents: 670000,
      expense_cents: -300000,
      net_cents: 370000,
      previous: { month: "2026-07", income_cents: 600000, expense_cents: -150000, net_cents: 450000 },
      uncategorized_count: 1,
    })
  })

  it("splits the month's expenses by category, biggest first, with uncategorized as its own slice", async () => {
    const { token } = await setup()

    const slices = (await get(token, "/reports/by-category?month=2026-08")).json()

    expect(slices.map((slice: { category: { name: string } | null }) => slice.category?.name ?? null)).toEqual([
      "Moradia",
      null,
      "Mercado",
    ])
    expect(slices[0]).toMatchObject({ total_cents: 180000, share: 0.6, transactions_count: 1 })
    expect(slices[1]).toMatchObject({ total_cents: 70000, share: 0.2333, transactions_count: 1 })
    expect(slices[2]).toMatchObject({ total_cents: 50000, share: 0.1667, transactions_count: 2 })
    expect(slices[0].category.color).toBe("blue")
  })

  it("can split income instead", async () => {
    const { token } = await setup()

    const slices = (await get(token, "/reports/by-category?month=2026-08&kind=income")).json()

    expect(slices.map((slice: { total_cents: number }) => slice.total_cents)).toEqual([650000, 20000])
  })

  it("returns every month of the trend in order, including empty ones", async () => {
    const { token } = await setup()

    const trend = (await get(token, "/reports/monthly?until=2026-09&months=4")).json()

    expect(trend).toEqual([
      { month: "2026-06", income_cents: 0, expense_cents: 0, net_cents: 0 },
      { month: "2026-07", income_cents: 600000, expense_cents: -150000, net_cents: 450000 },
      { month: "2026-08", income_cents: 670000, expense_cents: -300000, net_cents: 370000 },
      { month: "2026-09", income_cents: 0, expense_cents: -99999, net_cents: -99999 },
    ])
  })

  it("validates the month format and keeps reports private", async () => {
    const { token } = await setup()
    const stranger = await createUserAndLogin(app)

    const badMonth = await get(token, "/reports/summary?month=2026-13")
    const strangerSummary = (await get(stranger.token, "/reports/summary?month=2026-08")).json()

    expect(badMonth.statusCode).toBe(400)
    expect(strangerSummary.expense_cents).toBe(0)
  })
})

describe("month helpers", () => {
  it("walks across year boundaries", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01")
    expect(addMonths("2026-01", -1)).toBe("2025-12")
    expect(listMonths("2026-02", 3)).toEqual(["2025-12", "2026-01", "2026-02"])
    expect(monthRange("2026-12").end.toISOString()).toBe("2027-01-01T00:00:00.000Z")
  })
})
