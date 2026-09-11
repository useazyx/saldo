import { screen, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { currentMonth, shiftMonth } from "../lib/format"
import { mockApi, renderApp } from "../test/renderApp"

const ANA = { id: "u1", name: "Ana Souza", email: "ana@saldo.dev", created_at: "2026-09-01T00:00:00.000Z" }
const MONTH = currentMonth()
const PREVIOUS = shiftMonth(MONTH, -1)

const SUMMARY = {
  month: MONTH,
  income_cents: 670000,
  expense_cents: -300000,
  net_cents: 370000,
  previous: { month: PREVIOUS, income_cents: 600000, expense_cents: -350000, net_cents: 250000 },
  uncategorized_count: 2,
}

const SLICES = [
  { category: { id: "c1", name: "Moradia", color: "blue" }, total_cents: 180000, share: 0.6, transactions_count: 1 },
  { category: null, total_cents: 70000, share: 0.2333, transactions_count: 2 },
  { category: { id: "c2", name: "Mercado", color: "orange" }, total_cents: 50000, share: 0.1667, transactions_count: 2 },
]

const TREND = [
  { month: PREVIOUS, income_cents: 600000, expense_cents: -350000, net_cents: 250000 },
  { month: MONTH, income_cents: 670000, expense_cents: -300000, net_cents: 370000 },
]

const BUDGETS = [
  {
    id: "b1",
    month: MONTH,
    category: { id: "c3", name: "Restaurantes e delivery", color: "aqua" },
    limit_cents: 12000,
    spent_cents: 14640,
    remaining_cents: -2640,
    used_share: 1.22,
    status: "over",
  },
]

describe("dashboard", () => {
  beforeEach(() => {
    localStorage.setItem("saldo.token", "t0k3n")
    mockApi((url) => {
      if (url.includes("/auth/me")) return { status: 200, body: ANA }
      if (url.includes("/reports/summary")) return { status: 200, body: SUMMARY }
      if (url.includes("/reports/by-category")) return { status: 200, body: SLICES }
      if (url.includes("/reports/monthly")) return { status: 200, body: TREND }
      if (url.includes("/budgets")) return { status: 200, body: BUDGETS }
      return { status: 404, body: { error: "RouteNotFound", message: "?" } }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("leads with the month balance and compares income and expenses with the previous month", async () => {
    renderApp("/")

    expect(await screen.findByText("+R$ 3.700,00")).toBeInTheDocument()
    expect(screen.getByText(/R\$ 700,00 a mais que/)).toBeInTheDocument()
    expect(screen.getByText(/R\$ 500,00 a menos que/)).toBeInTheDocument()
    expect(screen.getByText(/2 lançamentos deste mês estão sem categoria/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Organizar agora" })).toHaveAttribute(
      "href",
      `/lancamentos?mes=${MONTH}&categoria=none`
    )
  })

  it("exposes the chart data as tables for screen readers", async () => {
    renderApp("/")

    const spending = await screen.findByRole("table", { name: "Saídas por categoria" })
    const rows = within(spending).getAllByRole("row").slice(1)
    expect(rows.map((row) => row.textContent)).toEqual([
      "MoradiaR$ 1.800,0060%",
      "Sem categoriaR$ 700,0023%",
      "MercadoR$ 500,0017%",
    ])
    expect(screen.getByRole("table", { name: "Entradas e saídas por mês" })).toBeInTheDocument()
  })

  it("shows budget status with words, not only color", async () => {
    renderApp("/")

    expect(await screen.findByText(/Estourou · 122%/)).toBeInTheDocument()
    expect(screen.getByRole("progressbar", { name: "Orçamento de Restaurantes e delivery" })).toHaveAttribute(
      "aria-valuenow",
      "122"
    )
  })
})
