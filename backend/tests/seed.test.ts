import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { DEMO_EMAIL, DEMO_PASSWORD, seed } from "../prisma/seed.js"
import { prisma } from "../src/config/prisma.js"
import { authHeader, createTestApp, resetDatabase, type TestApp } from "./helpers.js"

// Data fixa pra o teste não depender do dia em que roda: 28 de agosto de 2026
const FIXED_NOW = new Date("2026-08-28T12:00:00.000Z")

describe("demo seed", () => {
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

  it("can run again and again without duplicating anything", async () => {
    await seed(FIXED_NOW)
    const counts = async () => ({
      users: await prisma.user.count(),
      accounts: await prisma.account.count(),
      categories: await prisma.category.count(),
      rules: await prisma.categoryRule.count(),
      transactions: await prisma.transaction.count(),
      budgets: await prisma.budget.count(),
    })
    const first = await counts()

    await seed(FIXED_NOW)

    expect(await counts()).toEqual(first)
    expect(first).toMatchObject({ users: 1, accounts: 2, rules: 12, budgets: 4 })
    expect(first.transactions).toBeGreaterThan(50)
  })

  it("never creates transactions in the future", async () => {
    await seed(FIXED_NOW)

    const latest = await prisma.transaction.findFirstOrThrow({ orderBy: { occurred_on: "desc" } })

    expect(latest.occurred_on.toISOString().slice(0, 10) <= "2026-08-28").toBe(true)
  })

  it("gives the demo account a dashboard worth looking at", async () => {
    await seed(FIXED_NOW)

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    })
    const headers = authHeader(login.json().token)
    const summary = (await app.inject({ method: "GET", url: "/reports/summary?month=2026-08", headers })).json()
    const slices = (await app.inject({ method: "GET", url: "/reports/by-category?month=2026-08", headers })).json()

    expect(login.statusCode).toBe(200)
    expect(summary.income_cents).toBeGreaterThan(0)
    expect(summary.expense_cents).toBeLessThan(0)
    expect(summary.uncategorized_count).toBe(1)
    expect(slices.length).toBeGreaterThanOrEqual(8)
  })
})
