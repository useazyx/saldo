import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { authHeader, createTestApp, createUserAndLogin, resetDatabase, type TestApp } from "./helpers.js"

describe("accounts", () => {
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

  const createAccount = (token: string, name: string) =>
    app.inject({ method: "POST", url: "/accounts", headers: authHeader(token), payload: { name } })

  it("creates accounts and lists them with balance and transaction count", async () => {
    const { token, user } = await createUserAndLogin(app)
    const nubank = await createAccount(token, "Nubank")
    await createAccount(token, "Carteira")

    await prisma.transaction.createMany({
      data: [
        { user_id: user.id, account_id: nubank.json().id, occurred_on: new Date("2026-09-01"), description: "Salário", amount_cents: 500000, fingerprint: "a" },
        { user_id: user.id, account_id: nubank.json().id, occurred_on: new Date("2026-09-02"), description: "Mercado", amount_cents: -32050, fingerprint: "b" },
      ],
    })

    const response = await app.inject({ method: "GET", url: "/accounts", headers: authHeader(token) })

    expect(nubank.statusCode).toBe(201)
    expect(response.json()).toEqual([
      expect.objectContaining({ name: "Carteira", balance_cents: 0, transactions_count: 0 }),
      expect.objectContaining({ name: "Nubank", balance_cents: 467950, transactions_count: 2 }),
    ])
  })

  it("does not allow two accounts with the same name", async () => {
    const { token } = await createUserAndLogin(app)
    await createAccount(token, "Nubank")

    const duplicate = await createAccount(token, "Nubank")

    expect(duplicate.statusCode).toBe(409)
    expect(duplicate.json().error).toBe("AccountNameTaken")
  })

  it("keeps each person's accounts private", async () => {
    const owner = await createUserAndLogin(app)
    const stranger = await createUserAndLogin(app)
    const account = await createAccount(owner.token, "Nubank")
    const url = `/accounts/${account.json().id}`

    const strangerList = await app.inject({ method: "GET", url: "/accounts", headers: authHeader(stranger.token) })
    const rename = await app.inject({
      method: "PATCH",
      url,
      headers: authHeader(stranger.token),
      payload: { name: "Minha agora" },
    })
    const remove = await app.inject({ method: "DELETE", url, headers: authHeader(stranger.token) })

    expect(strangerList.json()).toEqual([])
    expect(rename.statusCode).toBe(404)
    expect(remove.statusCode).toBe(404)
  })

  it("renames and deletes an account together with its transactions", async () => {
    const { token, user } = await createUserAndLogin(app)
    const account = await createAccount(token, "Itau")
    const url = `/accounts/${account.json().id}`
    await prisma.transaction.create({
      data: { user_id: user.id, account_id: account.json().id, occurred_on: new Date("2026-09-01"), description: "Pix", amount_cents: -1000, fingerprint: "x" },
    })

    const rename = await app.inject({ method: "PATCH", url, headers: authHeader(token), payload: { name: "Itaú" } })
    const remove = await app.inject({ method: "DELETE", url, headers: authHeader(token) })

    expect(rename.json()).toMatchObject({ name: "Itaú", transactions_count: 1 })
    expect(remove.statusCode).toBe(204)
    expect(await prisma.transaction.count()).toBe(0)
  })
})
