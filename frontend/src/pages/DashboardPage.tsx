import { useAuth } from "../auth/AuthContext"

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Olá, {user?.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-ink-muted">Aqui vai o resumo do mês.</p>
    </div>
  )
}
