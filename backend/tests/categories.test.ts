import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

describe("categories", () => {
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

  const listCategories = async (token: string) =>
    (await app.inject({ method: "GET", url: "/categories", headers: authHeader(token) })).json() as {
      id: string
      name: string
      kind: string
      color: string
      transactions_count: number
    }[]

  it("lists the default categories with expenses first", async () => {
    const { token } = await createUserAndLogin(app)

    const categories = await listCategories(token)
    const firstIncome = categories.findIndex((category) => category.kind === "INCOME")

    expect(categories.slice(0, firstIncome).every((category) => category.kind === "EXPENSE")).toBe(true)
    expect(categories.slice(firstIncome).every((category) => category.kind === "INCOME")).toBe(true)
  })

  it("creates a category with a palette color and refuses colors outside it", async () => {
    const { token } = await createUserAndLogin(app)

    const created = await app.inject({
      method: "POST",
      url: "/categories",
      headers: authHeader(token),
      payload: { name: "Pets", kind: "EXPENSE", color: "violet" },
    })
    const invalidColor = await app.inject({
      method: "POST",
      url: "/categories",
      headers: authHeader(token),
      payload: { name: "Viagens", kind: "EXPENSE", color: "#ff00ff" },
    })
    const duplicate = await app.inject({
      method: "POST",
      url: "/categories",
      headers: authHeader(token),
      payload: { name: "Pets", kind: "EXPENSE", color: "red" },
    })

    expect(created.statusCode).toBe(201)
    expect(created.json()).toMatchObject({ name: "Pets", color: "violet", transactions_count: 0 })
    expect(invalidColor.statusCode).toBe(400)
    expect(duplicate.statusCode).toBe(409)
  })

  it("renames and recolors, but only the owner's categories", async () => {
    const owner = await createUserAndLogin(app)
    const stranger = await createUserAndLogin(app)
    const mercado = (await listCategories(owner.token)).find((category) => category.name === "Mercado")!

    const update = await app.inject({
      method: "PATCH",
      url: `/categories/${mercado.id}`,
      headers: authHeader(owner.token),
      payload: { name: "Supermercado", color: "green" },
    })
    const byStranger = await app.inject({
      method: "PATCH",
      url: `/categories/${mercado.id}`,
      headers: authHeader(stranger.token),
      payload: { name: "Meu" },
    })

    expect(update.json()).toMatchObject({ name: "Supermercado", color: "green", kind: "EXPENSE" })
    expect(byStranger.statusCode).toBe(404)
  })

  it("leaves transactions uncategorized when their category is deleted", async () => {
    const { token, user } = await createUserAndLogin(app)
    const account = await prisma.account.create({ data: { user_id: user.id, name: "Nubank" } })
    const lazer = (await listCategories(token)).find((category) => category.name === "Lazer")!
    const transaction = await prisma.transaction.create({
      data: {
        user_id: user.id,
        account_id: account.id,
        category_id: lazer.id,
        occurred_on: new Date("2026-09-05"),
        description: "Cinema",
        amount_cents: -4800,
        fingerprint: "cinema",
      },
    })

    const remove = await app.inject({ method: "DELETE", url: `/categories/${lazer.id}`, headers: authHeader(token) })

    expect(remove.statusCode).toBe(204)
    const saved = await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } })
    expect(saved.category_id).toBeNull()
  })
})
