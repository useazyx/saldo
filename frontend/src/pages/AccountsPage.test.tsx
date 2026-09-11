import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mockApi, renderApp } from "../test/renderApp"

const ANA = { id: "u1", name: "Ana Souza", email: "ana@saldo.dev", created_at: "2026-09-01T00:00:00.000Z" }
const ACCOUNTS = [
  { id: "a1", name: "Conta Nubank", created_at: "", balance_cents: 424250, transactions_count: 32 },
  { id: "a2", name: "Cartão Nubank", created_at: "", balance_cents: -98760, transactions_count: 1 },
]

describe("accounts page", () => {
  let fetchMock: ReturnType<typeof mockApi>

  beforeEach(() => {
    localStorage.setItem("saldo.token", "t0k3n")
    fetchMock = mockApi((url, init) => {
      if (url.includes("/auth/me")) return { status: 200, body: ANA }
      if (url.includes("/accounts") && init.method === "POST") return { status: 201, body: ACCOUNTS[0] }
      if (url.includes("/accounts") && init.method === "DELETE") return { status: 204 }
      if (url.includes("/accounts")) return { status: 200, body: ACCOUNTS }
      return { status: 200, body: [] }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("lists accounts with balance and a link to their transactions", async () => {
    renderApp("/contas")

    const card = (await screen.findByText("Cartão Nubank")).closest("li")!
    expect(within(card).getByText("−R$ 987,60")).toBeInTheDocument()
    expect(within(card).getByRole("link", { name: "1 lançamento" })).toHaveAttribute("href", "/lancamentos?conta=a2")
  })

  it("creates an account", async () => {
    renderApp("/contas")
    await screen.findByText("Conta Nubank")

    await userEvent.type(screen.getByLabelText("Nome da conta"), "Carteira")
    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }))

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith("/accounts") && init?.method === "POST")
      expect(JSON.parse(String(post?.[1]?.body))).toEqual({ name: "Carteira" })
    })
  })

  it("warns that deleting removes the account's transactions before doing it", async () => {
    renderApp("/contas")
    await screen.findByText("Conta Nubank")

    await userEvent.click(screen.getByRole("button", { name: "Apagar Conta Nubank" }))
    expect(screen.getByText(/também apaga os 32 lançamentos dela/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Apagar conta" }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith("/accounts/a1") && init?.method === "DELETE")).toBe(true)
    )
  })
})
