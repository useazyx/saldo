import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mockApi, renderApp } from "../test/renderApp"

const ANA = { id: "u1", name: "Ana Souza", email: "ana@saldo.dev", created_at: "2026-09-01T00:00:00.000Z" }
const ACCOUNTS = [
  { id: "a1", name: "Conta Nubank", created_at: "", balance_cents: 0, transactions_count: 0 },
  { id: "a2", name: "Cartão Nubank", created_at: "", balance_cents: 0, transactions_count: 0 },
]
const PREVIEW = {
  format: "nubank-card",
  total_rows: 5,
  new_rows: 4,
  duplicate_rows: 0,
  errors: [{ line: 6, message: 'Data inválida: "2026-13-01"' }],
  rows: [
    { line: 2, occurred_on: "2026-08-03", description: "IFOOD *RESTAURANTE", amount_cents: -4590, category: { id: "c1", name: "Restaurantes e delivery", color: "aqua" } },
    { line: 3, occurred_on: "2026-08-03", description: "IFOOD *RESTAURANTE", amount_cents: -4590, category: { id: "c1", name: "Restaurantes e delivery", color: "aqua" } },
    { line: 4, occurred_on: "2026-08-05", description: "Uber *Trip", amount_cents: -2310, category: null },
    { line: 5, occurred_on: "2026-08-06", description: "Estorno", amount_cents: 1000, category: null },
  ],
}
const RESULT = {
  id: "i1",
  file_name: "fatura.csv",
  total_rows: 5,
  imported_rows: 4,
  duplicate_rows: 0,
  skipped_rows: 1,
  created_at: "2026-09-11T20:00:00.000Z",
  errors: PREVIEW.errors,
}

describe("import page", () => {
  let fetchMock: ReturnType<typeof mockApi>

  beforeEach(() => {
    localStorage.setItem("saldo.token", "t0k3n")
    fetchMock = mockApi((url, init) => {
      if (url.includes("/auth/me")) return { status: 200, body: ANA }
      if (url.includes("/accounts")) return { status: 200, body: ACCOUNTS }
      if (url.includes("/imports/preview")) return { status: 200, body: PREVIEW }
      if (url.includes("/imports") && init.method === "POST") return { status: 201, body: RESULT }
      if (url.includes("/imports")) return { status: 200, body: [] }
      return { status: 404, body: { error: "RouteNotFound", message: "?" } }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const csvFile = () => new File(["date,title,amount\n2026-08-03,IFOOD,45.90\n"], "fatura.csv", { type: "text/csv" })

  it("previews the file for the chosen account and then imports it", async () => {
    renderApp("/importar")
    const accountSelect = await screen.findByLabelText("Conta")
    await waitFor(() => expect(within(accountSelect).getAllByRole("option")).toHaveLength(2))

    await userEvent.selectOptions(accountSelect, "a2")
    await userEvent.upload(screen.getByLabelText("Arquivo CSV"), csvFile())
    await userEvent.click(screen.getByRole("button", { name: "Ver prévia" }))

    expect(await screen.findByText("Fatura do cartão Nubank")).toBeInTheDocument()
    expect(screen.getByText(/Linha 6: Data inválida/)).toBeInTheDocument()
    expect(screen.getByText(/2 lançamentos novos vão entrar sem categoria/)).toBeInTheDocument()

    const previewCall = fetchMock.mock.calls.find(([url]) => String(url).includes("/imports/preview"))!
    expect(String(previewCall[0])).toContain("account_id=a2")
    expect(previewCall[1]?.body).toBeInstanceOf(FormData)

    await userEvent.click(screen.getByRole("button", { name: "Importar 4 lançamentos" }))

    expect(await screen.findByText("fatura.csv importado")).toBeInTheDocument()
    expect(screen.getByText(/4 novos · 0 já existiam · 1 pulados/)).toBeInTheDocument()
  })

  it("does not offer to import when nothing is new", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input)
      const body = url.includes("/auth/me")
        ? ANA
        : url.includes("/accounts")
          ? ACCOUNTS
          : url.includes("/imports/preview")
            ? { ...PREVIEW, new_rows: 0, duplicate_rows: 4, errors: [], rows: [] }
            : []
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
    })
    renderApp("/importar")
    await screen.findByLabelText("Conta")

    await userEvent.upload(screen.getByLabelText("Arquivo CSV"), csvFile())
    await userEvent.click(screen.getByRole("button", { name: "Ver prévia" }))

    expect(await screen.findByRole("button", { name: "Nada novo pra importar" })).toBeDisabled()
  })
})
