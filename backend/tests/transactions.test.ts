import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

describe("transactions", () => {
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

  // Pessoa com duas contas e um mês de lançamentos variados
  async function setup() {
    const person = await createUserAndLogin(app)
    const nubank = await prisma.account.create({ data: { user_id: person.user.id, name: "Nubank" } })
    const wallet = await prisma.account.create({ data: { user_id: person.user.id, name: "Carteira" } })
    const categories = await prisma.category.findMany({ where: { user_id: person.user.id } })
    const category = (name: string) => categories.find((item) => item.name === name)!

    const row = (day: number, description: string, amount: number, extra: object = {}) => ({
      user_id: person.user.id,
      account_id: nubank.id,
      occurred_on: new Date(`2026-08-${String(day).padStart(2, "0")}T00:00:00.000Z`),
      description,
      amount_cents: amount,
      fingerprint: `${day}-${description}`,
      ...extra,
    })

    await prisma.transaction.createMany({
      data: [
        row(1, "Salário ACME", 650000, { category_id: category("Salário").id }),
        row(3, "Supermercado Dia", -32050, { category_id: category("Mercado").id }),
        row(10, "IFOOD *Pizza", -8900),
        row(15, "Aluguel", -180000, { category_id: category("Moradia").id }),
        row(20, "Cinema", -4800, { account_id: wallet.id }),
      ],
    })

    return { ...person, nubank, wallet, category }
  }

  const list = (token: string, query = "") =>
    app.inject({ method: "GET", url: `/transactions${query}`, headers: authHeader(token) })

  describe("listing", () => {
    it("returns the newest first with totals for everything matched", async () => {
      const { token } = await setup()

      const response = await list(token)

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.transactions.map((t: { occurred_on: string }) => t.occurred_on)).toEqual([
        "2026-08-20", "2026-08-15", "2026-08-10", "2026-08-03", "2026-08-01",
      ])
      expect(body.totals).toEqual({ income_cents: 650000, expense_cents: -225750, net_cents: 424250 })
    })

    it("filters by account, category, kind, period and text", async () => {
      const { token, wallet, category } = await setup()

      const byAccount = (await list(token, `?account_id=${wallet.id}`)).json()
      const uncategorized = (await list(token, "?category_id=none")).json()
      const byCategory = (await list(token, `?category_id=${category("Moradia").id}`)).json()
      const income = (await list(token, "?kind=income")).json()
      const period = (await list(token, "?from=2026-08-03&to=2026-08-15")).json()
      const search = (await list(token, "?search=ifood")).json()

      expect(byAccount.transactions.map((t: { description: string }) => t.description)).toEqual(["Cinema"])
      expect(uncategorized.total).toBe(2)
      expect(byCategory.totals.expense_cents).toBe(-180000)
      expect(income.transactions).toHaveLength(1)
      expect(period.total).toBe(3)
      expect(search.transactions[0].description).toBe("IFOOD *Pizza")
    })

    it("paginates and rejects a backwards period", async () => {
      const { token } = await setup()

      const page = (await list(token, "?page=2&page_size=2")).json()
      const backwards = await list(token, "?from=2026-08-20&to=2026-08-01")

      expect(page).toMatchObject({ total: 5, current_page: 2, total_pages: 3 })
      expect(page.transactions).toHaveLength(2)
      expect(backwards.statusCode).toBe(400)
    })

    it("never shows another person's transactions", async () => {
      await setup()
      const stranger = await createUserAndLogin(app)

      expect((await list(stranger.token)).json().total).toBe(0)
    })
  })

  describe("manual entries and edits", () => {
    it("creates a manual expense and lets the rules pick the category", async () => {
      const { token, user, wallet, category } = await setup()
      await prisma.categoryRule.create({
        data: { user_id: user.id, pattern: "padaria", category_id: category("Mercado").id },
      })

      const response = await app.inject({
        method: "POST",
        url: "/transactions",
        headers: authHeader(token),
        payload: { account_id: wallet.id, occurred_on: "2026-08-21", description: "Padaria da esquina", amount_cents: -1450 },
      })

      expect(response.statusCode).toBe(201)
      expect(response.json()).toMatchObject({
        occurred_on: "2026-08-21",
        amount_cents: -1450,
        account: { name: "Carteira" },
        category: { name: "Mercado", kind: "EXPENSE" },
      })
    })

    it("refuses zero amounts, impossible dates and other people's accounts", async () => {
      const { token, nubank } = await setup()
      const stranger = await createUserAndLogin(app)
      const payload = { account_id: nubank.id, occurred_on: "2026-08-21", description: "Teste", amount_cents: -100 }

      const zero = await app.inject({ method: "POST", url: "/transactions", headers: authHeader(token), payload: { ...payload, amount_cents: 0 } })
      const badDate = await app.inject({ method: "POST", url: "/transactions", headers: authHeader(token), payload: { ...payload, occurred_on: "2026-02-30" } })
      const notTheirs = await app.inject({ method: "POST", url: "/transactions", headers: authHeader(stranger.token), payload })

      expect(zero.statusCode).toBe(400)
      expect(badDate.statusCode).toBe(400)
      expect(notTheirs.statusCode).toBe(404)
    })

    it("changes category and notes, clears the category and deletes", async () => {
      const { token, category } = await setup()
      const pizza = (await list(token, "?search=pizza")).json().transactions[0]
      const url = `/transactions/${pizza.id}`

      const categorized = await app.inject({
        method: "PATCH",
        url,
        headers: authHeader(token),
        payload: { category_id: category("Restaurantes e delivery").id, notes: "Aniversário" },
      })
      const cleared = await app.inject({ method: "PATCH", url, headers: authHeader(token), payload: { category_id: null } })
      const removed = await app.inject({ method: "DELETE", url, headers: authHeader(token) })

      expect(categorized.json()).toMatchObject({ notes: "Aniversário", category: { name: "Restaurantes e delivery" } })
      expect(cleared.json().category).toBeNull()
      expect(removed.statusCode).toBe(204)
      expect((await list(token)).json().total).toBe(4)
    })

    it("does not let anyone edit or use what is not theirs", async () => {
      const { token } = await setup()
      const stranger = await createUserAndLogin(app)
      const strangerCategory = await prisma.category.findFirstOrThrow({ where: { user_id: stranger.user.id } })
      const pizza = (await list(token, "?search=pizza")).json().transactions[0]

      const byStranger = await app.inject({
        method: "PATCH",
        url: `/transactions/${pizza.id}`,
        headers: authHeader(stranger.token),
        payload: { notes: "meu" },
      })
      const foreignCategory = await app.inject({
        method: "PATCH",
        url: `/transactions/${pizza.id}`,
        headers: authHeader(token),
        payload: { category_id: strangerCategory.id },
      })

      expect(byStranger.statusCode).toBe(404)
      expect(foreignCategory.statusCode).toBe(404)
    })
  })
})
