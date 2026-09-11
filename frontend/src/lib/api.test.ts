import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError, apiRequest, OFFLINE_MESSAGE } from "./api"

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("calls the API through /api with the token and skips empty query values", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }))
    vi.stubGlobal("fetch", fetchMock)

    await apiRequest("/transactions", { token: "abc", query: { kind: "expense", search: "", page: 2 } })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/transactions?kind=expense&page=2")
    expect(init.headers.Authorization).toBe("Bearer abc")
  })

  it("turns the API error format into an ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(409, { error: "AccountNameTaken", message: "Já existe" })))

    const error = await apiRequest("/accounts", { method: "POST", body: { name: "Nubank" } }).catch((e) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: "AccountNameTaken", message: "Já existe" })
  })

  it("explains when the backend is not running", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
    const offline = (await apiRequest("/health").catch((e: unknown) => e)) as ApiError

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("proxy error", { status: 502 })))
    const proxyDown = (await apiRequest("/health").catch((e: unknown) => e)) as ApiError

    expect(offline.message).toBe(OFFLINE_MESSAGE)
    expect(proxyDown.code).toBe("ApiOffline")
  })

  it("returns nothing for 204 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })))

    await expect(apiRequest("/accounts/1", { method: "DELETE" })).resolves.toBeUndefined()
  })
})
