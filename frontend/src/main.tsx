import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"

// Ponto de entrada: por enquanto só confirma que o build e o Tailwind estão de pé
function App() {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <h1 className="text-2xl font-semibold text-ink">Saldo</h1>
    </main>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
