import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

describe("budgets", () => {
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

  // Agosto: Mercado gastou R$ 450, Lazer R$ 90, Restaurantes R$ 210 (e um Mercado de setembro que não conta)
  async function setup() {
    const person = await createUserAndLogin(app)
    const account = await prisma.account.create({ data: { user_id: person.user.id, name: "Nubank" } })
    const categories = await prisma.category.findMany({ where: { user_id: person.user.id } })
    const category = (name: string) => categories.find((item) => item.name === name)!.id

    let counter = 0
    const row = (date: string, amount: number, name: string) => ({
      user_id: person.user.id,
      account_id: account.id,
      category_id: category(name),
      occurred_on: new Date(`${date}T00:00:00.000Z`),
      description: `Gasto ${++counter}`,
      amount_cents: amount,
      fingerprint: String(counter),
    })

    await prisma.transaction.createMany({
      data: [
        row("2026-08-03", -30000, "Mercado"),
        row("2026-08-20", -15000, "Mercado"),
        row("2026-08-10", -9000, "Lazer"),
        row("2026-08-15", -21000, "Restaurantes e delivery"),
        row("2026-09-01", -50000, "Mercado"),
      ],
    })

    return { ...person, category }
  }

  const setBudget = (token: string, payload: object) =>
    app.inject({ method: "PUT", url: "/budgets", headers: authHeader(token), payload })

  it("shows each budget with what was spent, what is left and a status, tightest first", async () => {
    const { token, category } = await setup()
    await setBudget(token, { category_id: category("Mercado"), month: "2026-08", limit_cents: 40000 })
    await setBudget(token, { category_id: category("Lazer"), month: "2026-08", limit_cents: 30000 })
    await setBudget(token, { category_id: category("Restaurantes e delivery"), month: "2026-08", limit_cents: 25000 })

    const budgets = (await app.inject({ method: "GET", url: "/budgets?month=2026-08", headers: authHeader(token) })).json()

    expect(budgets.map((budget: { category: { name: string }; status: string }) => [budget.category.name, budget.status])).toEqual([
      ["Mercado", "over"],
      ["Restaurantes e delivery", "warning"],
      ["Lazer", "ok"],
    ])
    expect(budgets[0]).toMatchObject({ limit_cents: 40000, spent_cents: 45000, remaining_cents: -5000, used_share: 1.125 })
    expect(budgets[1]).toMatchObject({ spent_cents: 21000, used_share: 0.84 })
  })

  it("updates the limit instead of creating a second budget for the same month", async () => {
    const { token, category } = await setup()

    await setBudget(token, { category_id: category("Mercado"), month: "2026-08", limit_cents: 40000 })
    const updated = await setBudget(token, { category_id: category("Mercado"), month: "2026-08", limit_cents: 60000 })

    expect(updated.statusCode).toBe(200)
    expect(updated.json()).toMatchObject({ limit_cents: 60000, spent_cents: 45000, status: "ok" })
    expect(await prisma.budget.count()).toBe(1)
  })

  it("keeps months apart", async () => {
    const { token, category } = await setup()
    await setBudget(token, { category_id: category("Mercado"), month: "2026-09", limit_cents: 40000 })

    const august = (await app.inject({ method: "GET", url: "/budgets?month=2026-08", headers: authHeader(token) })).json()
    const september = (await app.inject({ method: "GET", url: "/budgets?month=2026-09", headers: authHeader(token) })).json()

    expect(august).toEqual([])
    expect(september[0]).toMatchObject({ month: "2026-09", spent_cents: 50000, status: "over" })
  })

  it("only accepts the person's own expense categories", async () => {
    const { token, category } = await setup()
    const stranger = await createUserAndLogin(app)

    const income = await setBudget(token, { category_id: category("Salário"), month: "2026-08", limit_cents: 40000 })
    const foreign = await setBudget(stranger.token, { category_id: category("Mercado"), month: "2026-08", limit_cents: 40000 })

    expect(income.statusCode).toBe(422)
    expect(foreign.statusCode).toBe(404)
  })

  it("deletes a budget", async () => {
    const { token, category } = await setup()
    const budget = await setBudget(token, { category_id: category("Lazer"), month: "2026-08", limit_cents: 30000 })

    const removed = await app.inject({ method: "DELETE", url: `/budgets/${budget.json().id}`, headers: authHeader(token) })
    const again = await app.inject({ method: "DELETE", url: `/budgets/${budget.json().id}`, headers: authHeader(token) })

    expect(removed.statusCode).toBe(204)
    expect(again.statusCode).toBe(404)
  })
})
