import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { mockApi, renderApp } from "../test/renderApp"

const ANA = { id: "u1", name: "Ana Souza", email: "ana@saldo.dev", created_at: "2026-09-01T00:00:00.000Z" }

describe("login", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("sends people without a session to the login page", async () => {
    mockApi(() => ({ status: 200, body: {} }))

    renderApp("/")

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument()
  })

  it("shows the API message when the password is wrong", async () => {
    mockApi(() => ({ status: 401, body: { error: "InvalidCredentials", message: "E-mail ou senha incorretos" } }))
    renderApp("/entrar")

    await userEvent.type(screen.getByLabelText("E-mail"), "ana@saldo.dev")
    await userEvent.type(screen.getByLabelText("Senha"), "errada")
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos")
  })

  it("fills the demo account, logs in and opens the dashboard", async () => {
    const fetchMock = mockApi((url) =>
      url.endsWith("/auth/login") ? { status: 200, body: { token: "t0k3n", user: ANA } } : { status: 200, body: ANA }
    )
    renderApp("/entrar")

    await userEvent.click(screen.getByRole("button", { name: "Preencher com a conta demo" }))
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }))

    expect(await screen.findByRole("heading", { name: "Olá, Ana" })).toBeInTheDocument()
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(String(init?.body))).toEqual({ email: "ana@saldo.dev", password: "saldo123" })
    expect(localStorage.getItem("saldo.token")).toBe("t0k3n")
  })

  it("validates the sign up form before calling the API", async () => {
    const fetchMock = mockApi(() => ({ status: 201, body: ANA }))
    renderApp("/criar-conta")

    await userEvent.click(screen.getByRole("button", { name: "Criar conta" }))

    expect(screen.getByText("Nome precisa de pelo menos 2 letras")).toBeInTheDocument()
    expect(screen.getByText("Senha precisa de pelo menos 8 caracteres")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
