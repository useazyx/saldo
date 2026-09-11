import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mockApi, renderApp } from "../test/renderApp"

const ANA = { id: "u1", name: "Ana Souza", email: "ana@saldo.dev", created_at: "2026-09-01T00:00:00.000Z" }
const ACCOUNTS = [{ id: "a1", name: "Conta Nubank", created_at: "", balance_cents: 0, transactions_count: 2 }]
const CATEGORIES = [
  { id: "c1", name: "Mercado", kind: "EXPENSE", color: "orange", transactions_count: 1 },
  { id: "c2", name: "Lazer", kind: "EXPENSE", color: "green", transactions_count: 0 },
  { id: "c3", name: "Salário", kind: "INCOME", color: "blue", transactions_count: 1 },
]
const LIST = {
  transactions: [
    {
      id: "t1",
      occurred_on: "2026-08-17",
      description: "Supermercado Dia",
      amount_cents: -21450,
      notes: null,
      account: { id: "a1", name: "Conta Nubank" },
      category: { id: "c1", name: "Mercado", color: "orange", kind: "EXPENSE" },
    },
    {
      id: "t2",
      occurred_on: "2026-08-05",
      description: "PIX ENVIADO",
      amount_cents: -5000,
      notes: "Presente",
      account: { id: "a1", name: "Conta Nubank" },
      category: null,
    },
  ],
  total: 2,
  current_page: 1,
  total_pages: 1,
  totals: { income_cents: 0, expense_cents: -26450, net_cents: -26450 },
}

describe("transactions page", () => {
  let fetchMock: ReturnType<typeof mockApi>

  beforeEach(() => {
    localStorage.setItem("saldo.token", "t0k3n")
    fetchMock = mockApi((url, init) => {
      if (url.includes("/auth/me")) return { status: 200, body: ANA }
      if (url.includes("/accounts")) return { status: 200, body: ACCOUNTS }
      if (url.includes("/categories")) return { status: 200, body: CATEGORIES }
      if (url.includes("/transactions") && init.method === "PATCH") return { status: 200, body: LIST.transactions[1] }
      if (url.includes("/transactions") && init.method === "POST") return { status: 201, body: LIST.transactions[0] }
      if (url.includes("/transactions")) return { status: 200, body: LIST }
      return { status: 404, body: { error: "RouteNotFound", message: "?" } }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const calls = (predicate: (url: string, init: RequestInit) => boolean) =>
    fetchMock.mock.calls.filter(([url, init]) => predicate(String(url), init ?? {}))

  it("lists the month's transactions with totals", async () => {
    renderApp("/lancamentos?mes=2026-08")

    const table = await screen.findByRole("table", { name: "Lançamentos" })
    expect(within(table).getByText("Supermercado Dia")).toBeInTheDocument()
    expect(within(table).getByText("Presente")).toBeInTheDocument()
    expect(screen.getAllByText("−R$ 264,50").length).toBeGreaterThan(0)

    const listCall = calls((url) => url.includes("/api/transactions?"))[0]
    expect(String(listCall[0])).toContain("from=2026-08-01&to=2026-08-31")
  })

  it("sends the chosen filters to the API", async () => {
    renderApp("/lancamentos?mes=2026-08&categoria=none")
    await screen.findByRole("table", { name: "Lançamentos" })

    await userEvent.click(screen.getByRole("radio", { name: "Saídas" }))

    await waitFor(() => {
      const last = calls((url) => url.includes("/api/transactions?")).at(-1)
      expect(String(last?.[0])).toContain("category_id=none")
      expect(String(last?.[0])).toContain("kind=expense")
    })
  })

  it("changes a transaction's category right from the list", async () => {
    renderApp("/lancamentos?mes=2026-08")
    const table = await screen.findByRole("table", { name: "Lançamentos" })

    await userEvent.selectOptions(within(table).getByLabelText("Categoria de PIX ENVIADO"), "c2")

    await waitFor(() => {
      const patch = calls((url, init) => url.endsWith("/transactions/t2") && init.method === "PATCH")[0]
      expect(JSON.parse(String(patch[1]?.body))).toEqual({ category_id: "c2" })
    })
  })

  it("creates a manual expense with a negative amount", async () => {
    renderApp("/lancamentos?mes=2026-08")
    await screen.findByRole("table", { name: "Lançamentos" })

    await userEvent.click(screen.getByRole("button", { name: "Novo lançamento" }))
    await userEvent.type(screen.getByLabelText("Descrição"), "Feira de domingo")
    await userEvent.type(screen.getByLabelText("Valor (R$)"), "38,50")
    await userEvent.click(screen.getByRole("button", { name: "Salvar lançamento" }))

    await waitFor(() => {
      const post = calls((url, init) => url.endsWith("/api/transactions") && init.method === "POST")[0]
      expect(JSON.parse(String(post[1]?.body))).toMatchObject({
        account_id: "a1",
        description: "Feira de domingo",
        amount_cents: -3850,
        category_id: null,
      })
    })
  })
})
