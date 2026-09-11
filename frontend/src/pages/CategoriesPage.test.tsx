import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { mockApi, renderApp } from "../test/renderApp"

const ANA = { id: "u1", name: "Ana Souza", email: "ana@saldo.dev", created_at: "2026-09-01T00:00:00.000Z" }
const CATEGORIES = [
  { id: "c1", name: "Mercado", kind: "EXPENSE", color: "orange", transactions_count: 12 },
  { id: "c2", name: "Lazer", kind: "EXPENSE", color: "green", transactions_count: 1 },
  { id: "c3", name: "Salário", kind: "INCOME", color: "blue", transactions_count: 3 },
]
const RULES = [{ id: "r1", pattern: "supermercado", category: { id: "c1", name: "Mercado", color: "orange" } }]

describe("categories page", () => {
  let fetchMock: ReturnType<typeof mockApi>

  beforeEach(() => {
    localStorage.setItem("saldo.token", "t0k3n")
    fetchMock = mockApi((url, init) => {
      if (url.includes("/auth/me")) return { status: 200, body: ANA }
      if (url.includes("/categories") && init.method === "POST") return { status: 201, body: CATEGORIES[0] }
      if (url.includes("/categories") && init.method === "DELETE") return { status: 204 }
      if (url.includes("/categories")) return { status: 200, body: CATEGORIES }
      if (url.includes("/rules") && init.method === "POST") return { status: 201, body: { ...RULES[0], categorized: 3 } }
      if (url.includes("/rules")) return { status: 200, body: RULES }
      return { status: 200, body: [] }
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const bodyOf = (method: string, path: string) => {
    const call = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith(path) && init?.method === method)
    return call ? JSON.parse(String(call[1]?.body)) : undefined
  }

  it("groups categories into expenses and incomes with their usage", async () => {
    renderApp("/categorias")

    const expenses = await screen.findByRole("region", { name: "Saídas" })
    await waitFor(() => expect(within(expenses).getAllByRole("listitem")).toHaveLength(2))
    expect(within(expenses).getByText("12 lançamentos")).toBeInTheDocument()
    expect(within(screen.getByRole("region", { name: "Entradas" })).getByText("Salário")).toBeInTheDocument()
  })

  // O nome da categoria também aparece como opção nos seletores; a busca fica só na lista de saídas
  const expenseList = async () => within(await screen.findByRole("region", { name: "Saídas" }))

  it("creates a category with the chosen kind and color", async () => {
    renderApp("/categorias")
    await (await expenseList()).findByText("Mercado")

    await userEvent.type(screen.getByLabelText("Nova categoria"), "Pets")
    await userEvent.click(screen.getAllByRole("radio", { name: "Violeta" })[0])
    await userEvent.click(screen.getByRole("button", { name: "Criar categoria" }))

    await waitFor(() => expect(bodyOf("POST", "/categories")).toEqual({ name: "Pets", kind: "EXPENSE", color: "violet" }))
  })

  it("asks before deleting a category", async () => {
    renderApp("/categorias")
    await (await expenseList()).findByText("Lazer")

    await userEvent.click(screen.getByRole("button", { name: "Apagar Lazer" }))
    expect(screen.getByText("Os lançamentos ficam sem categoria.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Apagar" }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url, init]) => String(url).endsWith("/categories/c2") && init?.method === "DELETE")).toBe(true)
    )
  })

  it("creates a rule, applies it to past transactions and says how many changed", async () => {
    renderApp("/categorias")
    await screen.findByText("supermercado")

    await userEvent.type(screen.getByLabelText("Quando a descrição contém"), "ifood")
    await userEvent.selectOptions(screen.getByLabelText("Categoria da regra"), "c2")
    await userEvent.click(screen.getByRole("button", { name: "Criar regra" }))

    expect(await screen.findByText("3 lançamentos ganharam categoria.")).toBeInTheDocument()
    expect(bodyOf("POST", "/rules")).toEqual({ pattern: "ifood", category_id: "c2", apply_to_existing: true })
  })
})
