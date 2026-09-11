import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { currentMonth, shiftMonth } from "../lib/format"
import { mockApi, renderApp } from "../test/renderApp"

const ANA = { id: "u1", name: "Ana Souza", email: "ana@saldo.dev", created_at: "2026-09-01T00:00:00.000Z" }
const MONTH = currentMonth()
const PREVIOUS = shiftMonth(MONTH, -1)
const CATEGORIES = [
  { id: "c1", name: "Mercado", kind: "EXPENSE", color: "orange", transactions_count: 12 },
  { id: "c2", name: "Lazer", kind: "EXPENSE", color: "green", transactions_count: 1 },
  { id: "c3", name: "Salário", kind: "INCOME", color: "blue", transactions_count: 3 },
]
const budget = (id: string, category: (typeof CATEGORIES)[number], month: string, limit: number, spent: number) => ({
  id,
  month,
  category: { id: category.id, name: category.name, color: category.color },
  limit_cents: limit,
  spent_cents: spent,
  remaining_cents: limit - spent,
  used_share: spent / limit,
  status: spent > limit ? "over" : spent / limit >= 0.8 ? "warning" : "ok",
})

describe("budgets page", () => {
  let fetchMock: ReturnType<typeof mockApi>

  beforeEach(() => {
    localStorage.setItem("saldo.token", "t0k3n")
    fetchMock = mockApi((url, init) => {
      if (url.includes("/auth/me")) return { status: 200, body: ANA }
      if (url.includes("/categories")) return { status: 200, body: CATEGORIES }
      if (url.includes("/budgets") && init.method === "PUT") return { status: 200, body: {} }
      if (url.includes(`/budgets?month=${PREVIOUS}`)) {
        return { status: 200, body: [budget("p1", CATEGORIES[0], PREVIOUS, 60000, 58000), budget("p2", CATEGORIES[1], PREVIOUS, 15000, 9000)] }
      }
      if (url.includes("/budgets")) return { status: 200, body: [budget("b1", CATEGORIES[0], MONTH, 60000, 45000)] }
      return { status: 404, body: { error: "RouteNotFound", message: "?" } }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const putBodies = () =>
    fetchMock.mock.calls
      .filter(([url, init]) => String(url).endsWith("/budgets") && init?.method === "PUT")
      .map(([, init]) => JSON.parse(String(init?.body)))

  it("shows the month's budgets and only offers expense categories", async () => {
    renderApp("/orcamentos")

    expect(await screen.findByRole("progressbar", { name: "Orçamento de Mercado" })).toHaveAttribute("aria-valuenow", "75")
    const options = screen.getByLabelText("Categoria do orçamento").querySelectorAll("option")
    expect([...options].map((option) => option.textContent)).not.toContain("Salário")
  })

  it("sets a limit for the selected month in cents", async () => {
    renderApp("/orcamentos")
    await screen.findByRole("progressbar", { name: "Orçamento de Mercado" })

    await userEvent.selectOptions(screen.getByLabelText("Categoria do orçamento"), "c2")
    await userEvent.type(screen.getByLabelText("Limite (R$)"), "150,00")
    await userEvent.click(screen.getByRole("button", { name: "Definir limite" }))

    await waitFor(() => expect(putBodies()).toEqual([{ category_id: "c2", limit_cents: 15000, month: MONTH }]))
  })

  it("copies only the missing limits from the previous month", async () => {
    renderApp("/orcamentos")
    await screen.findByRole("progressbar", { name: "Orçamento de Mercado" })

    await userEvent.click(screen.getByRole("button", { name: "Copiar do mês anterior" }))

    expect(await screen.findByText("1 limites copiados.")).toBeInTheDocument()
    expect(putBodies()).toEqual([{ category_id: "c2", month: MONTH, limit_cents: 15000 }])
  })
})
