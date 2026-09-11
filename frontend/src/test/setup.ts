import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Cada teste começa com a tela limpa e sem sessão guardada
afterEach(() => {
  cleanup()
  localStorage.clear()
})
