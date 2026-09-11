import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { vi } from "vitest"
import { AppRoutes } from "../AppRoutes"
import { AuthProvider } from "../auth/AuthContext"

type Handler = (url: string, init: RequestInit) => { status: number; body?: unknown }

// Finge a API: cada chamada passa pelo handler, que devolve status e corpo
export function mockApi(handler: Handler) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const { status, body } = handler(String(input), init)
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

// O app inteiro (rotas, sessão e cache) numa URL inicial
export function renderApp(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}
