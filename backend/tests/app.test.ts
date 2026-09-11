import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createTestApp, type TestApp } from "./helpers.js"

describe("app basics", () => {
  let app: TestApp

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it("answers the health check with security and CORS headers", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://localhost:5176" },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: "ok" })
    expect(response.headers["x-content-type-options"]).toBe("nosniff")
    expect(response.headers["access-control-allow-origin"]).toBeDefined()
  })

  it("answers unknown routes in the API error format", async () => {
    const response = await app.inject({ method: "GET", url: "/nope" })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ error: "RouteNotFound", message: "A rota GET /nope não existe" })
  })
})
