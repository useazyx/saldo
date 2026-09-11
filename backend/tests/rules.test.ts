import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

describe("category rules", () => {
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

  // Pessoa com uma conta, três lançamentos sem categoria e um já categorizado à mão
  async function setup() {
    const person = await createUserAndLogin(app)
    const account = await prisma.account.create({ data: { user_id: person.user.id, name: "Nubank" } })
    const categories = await prisma.category.findMany({ where: { user_id: person.user.id } })
    const category = (name: string) => categories.find((item) => item.name === name)!

    const base = { user_id: person.user.id, account_id: account.id, occurred_on: new Date("2026-08-10") }
    await prisma.transaction.createMany({
      data: [
        { ...base, description: "UBER *TRIP", amount_cents: -2310, fingerprint: "1" },
        { ...base, description: "Uber Eats pedido", amount_cents: -3100, fingerprint: "2" },
        { ...base, description: "Padaria Pão Quente", amount_cents: -1250, fingerprint: "3" },
        { ...base, description: "Uber do trabalho", amount_cents: -1800, fingerprint: "4", category_id: category("Compras").id },
      ],
    })

    return { ...person, category }
  }

  const createRule = (token: string, payload: object) =>
    app.inject({ method: "POST", url: "/rules", headers: authHeader(token), payload })

  it("stores the pattern normalized and refuses duplicates", async () => {
    const { token, category } = await setup()

    const created = await createRule(token, { pattern: "  UBER  ", category_id: category("Transporte").id })
    const duplicate = await createRule(token, { pattern: "Uber", category_id: category("Lazer").id })

    expect(created.statusCode).toBe(201)
    expect(created.json()).toMatchObject({
      pattern: "uber",
      category: { name: "Transporte", color: "yellow" },
      categorized: 0,
    })
    expect(duplicate.statusCode).toBe(409)
  })

  it("does not accept another person's category", async () => {
    const { category } = await setup()
    const stranger = await createUserAndLogin(app)

    const response = await createRule(stranger.token, { pattern: "uber", category_id: category("Transporte").id })

    expect(response.statusCode).toBe(404)
  })

  it("can categorize past transactions right away, without touching manual choices", async () => {
    const { token, category } = await setup()

    const response = await createRule(token, {
      pattern: "uber",
      category_id: category("Transporte").id,
      apply_to_existing: true,
    })

    expect(response.json().categorized).toBe(2)
    const manual = await prisma.transaction.findFirstOrThrow({ where: { description: "Uber do trabalho" } })
    expect(manual.category_id).toBe(category("Compras").id)
  })

  it("applies every rule at once with the most specific one winning", async () => {
    const { token, category } = await setup()
    await createRule(token, { pattern: "uber", category_id: category("Transporte").id })
    await createRule(token, { pattern: "uber eats", category_id: category("Restaurantes e delivery").id })

    const applied = await app.inject({ method: "POST", url: "/rules/apply", headers: authHeader(token) })
    const eats = await prisma.transaction.findFirstOrThrow({ where: { description: "Uber Eats pedido" } })
    const padaria = await prisma.transaction.findFirstOrThrow({ where: { description: "Padaria Pão Quente" } })

    expect(applied.json()).toEqual({ categorized: 2 })
    expect(eats.category_id).toBe(category("Restaurantes e delivery").id)
    expect(padaria.category_id).toBeNull()
  })

  it("lists and deletes rules", async () => {
    const { token, category } = await setup()
    const rule = await createRule(token, { pattern: "padaria", category_id: category("Mercado").id })

    const list = await app.inject({ method: "GET", url: "/rules", headers: authHeader(token) })
    const remove = await app.inject({ method: "DELETE", url: `/rules/${rule.json().id}`, headers: authHeader(token) })
    const again = await app.inject({ method: "DELETE", url: `/rules/${rule.json().id}`, headers: authHeader(token) })

    expect(list.json()).toHaveLength(1)
    expect(remove.statusCode).toBe(204)
    expect(again.statusCode).toBe(404)
  })
})
