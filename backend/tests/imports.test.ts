import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { prisma } from "../src/config/prisma.js"
import { buildCategoryMatcher } from "../src/utils/categoryMatcher.js"
import {
  authHeader,
  createTestApp,
  createUserAndLogin,
  multipartFile,
  resetDatabase,
  type TestApp,
} from "./helpers.js"

const NUBANK_CARD_CSV = [
  "date,title,amount",
  "2026-08-03,IFOOD *RESTAURANTE BOM,45.90",
  "2026-08-03,IFOOD *RESTAURANTE BOM,45.90",
  "2026-08-05,Uber *Trip,23.10",
  "2026-08-06,Uber Eats,31.00",
  "2026-13-01,Linha quebrada,10.00",
].join("\n")

describe("statement imports", () => {
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

  // Pessoa com uma conta e duas regras: "uber" -> Transporte, "uber eats" e "ifood" -> Restaurantes
  async function setup() {
    const person = await createUserAndLogin(app)
    const account = await prisma.account.create({ data: { user_id: person.user.id, name: "Nubank" } })
    const categories = await prisma.category.findMany({ where: { user_id: person.user.id } })
    const byName = (name: string) => categories.find((category) => category.name === name)!

    await prisma.categoryRule.createMany({
      data: [
        { user_id: person.user.id, pattern: "uber", category_id: byName("Transporte").id },
        { user_id: person.user.id, pattern: "uber eats", category_id: byName("Restaurantes e delivery").id },
        { user_id: person.user.id, pattern: "ifood", category_id: byName("Restaurantes e delivery").id },
      ],
    })

    return { ...person, account }
  }

  const upload = (token: string, url: string, content: string | Buffer, fileName = "fatura-agosto.csv") => {
    const { payload, headers } = multipartFile(token, fileName, content)
    return app.inject({ method: "POST", url, payload, headers })
  }

  it("previews new rows with suggested categories without saving anything", async () => {
    const { token, account } = await setup()

    const response = await upload(token, `/imports/preview?account_id=${account.id}`, NUBANK_CARD_CSV)

    expect(response.statusCode).toBe(200)
    const preview = response.json()
    expect(preview).toMatchObject({ format: "nubank-card", total_rows: 5, new_rows: 4, duplicate_rows: 0 })
    expect(preview.errors).toEqual([{ line: 6, message: expect.stringContaining("Data inválida") }])
    expect(preview.rows.map((row: { description: string; category: { name: string } | null }) => [row.description, row.category?.name])).toEqual([
      ["IFOOD *RESTAURANTE BOM", "Restaurantes e delivery"],
      ["IFOOD *RESTAURANTE BOM", "Restaurantes e delivery"],
      ["Uber *Trip", "Transporte"],
      ["Uber Eats", "Restaurantes e delivery"],
    ])
    expect(await prisma.transaction.count()).toBe(0)
  })

  it("imports categorized rows once, and a second upload of the same file adds nothing", async () => {
    const { token, account } = await setup()
    const url = `/imports?account_id=${account.id}`

    const first = await upload(token, url, NUBANK_CARD_CSV)
    const second = await upload(token, url, NUBANK_CARD_CSV)

    expect(first.statusCode).toBe(201)
    expect(first.json()).toMatchObject({
      file_name: "fatura-agosto.csv",
      total_rows: 5,
      imported_rows: 4,
      duplicate_rows: 0,
      skipped_rows: 1,
    })
    expect(second.json()).toMatchObject({ imported_rows: 0, duplicate_rows: 4, skipped_rows: 1 })

    const transactions = await prisma.transaction.findMany({ orderBy: { amount_cents: "asc" } })
    expect(transactions).toHaveLength(4)
    expect(transactions.every((transaction) => transaction.amount_cents < 0)).toBe(true)
    expect(transactions.every((transaction) => transaction.category_id !== null)).toBe(true)

    const history = await app.inject({ method: "GET", url: "/imports", headers: authHeader(token) })
    expect(history.json()).toHaveLength(2)
    expect(history.json()[0].account).toEqual({ id: account.id, name: "Nubank" })
  })

  it("accepts the same file in a different account", async () => {
    const { token, user, account } = await setup()
    const wallet = await prisma.account.create({ data: { user_id: user.id, name: "Cartão da empresa" } })

    await upload(token, `/imports?account_id=${account.id}`, NUBANK_CARD_CSV)
    const other = await upload(token, `/imports?account_id=${wallet.id}`, NUBANK_CARD_CSV)

    expect(other.json().imported_rows).toBe(4)
  })

  it("reads Latin-1 files exported by Brazilian banks", async () => {
    const { token, account } = await setup()
    const latin1 = Buffer.from("Data;Descrição;Valor\n10/08/2026;Farmácia São João;-58,40\n", "latin1")

    const response = await upload(token, `/imports?account_id=${account.id}`, latin1, "extrato.csv")

    expect(response.statusCode).toBe(201)
    const saved = await prisma.transaction.findFirstOrThrow()
    expect(saved.description).toBe("Farmácia São João")
    expect(saved.amount_cents).toBe(-5840)
  })

  it("explains what went wrong with the upload", async () => {
    const { token, account } = await setup()
    const stranger = await createUserAndLogin(app)

    const otherPersonAccount = await upload(stranger.token, `/imports?account_id=${account.id}`, NUBANK_CARD_CSV)
    const notAStatement = await upload(token, `/imports?account_id=${account.id}`, "nome,idade\nAna,30")
    const tooLarge = await upload(token, `/imports?account_id=${account.id}`, "a".repeat(2 * 1024 * 1024 + 10))
    const noFile = await app.inject({
      method: "POST",
      url: `/imports?account_id=${account.id}`,
      headers: { ...authHeader(token), "content-type": "multipart/form-data; boundary=x" },
      payload: "--x--\r\n",
    })

    expect(otherPersonAccount.statusCode).toBe(404)
    expect(notAStatement.statusCode).toBe(422)
    expect(notAStatement.json().error).toBe("UnrecognizedStatement")
    expect(tooLarge.statusCode).toBe(413)
    expect(noFile.statusCode).toBe(400)
  })
})

describe("category matcher", () => {
  it("ignores case and accents and prefers the most specific rule", () => {
    const match = buildCategoryMatcher([
      { pattern: "uber", category_id: "transporte" },
      { pattern: "Uber Eats", category_id: "delivery" },
      { pattern: "farmácia", category_id: "saude" },
    ])

    expect(match("UBER EATS *PEDIDO")).toBe("delivery")
    expect(match("Uber *Trip")).toBe("transporte")
    expect(match("FARMACIA POPULAR")).toBe("saude")
    expect(match("Padaria")).toBeNull()
  })
})
