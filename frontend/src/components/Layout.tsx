import { LayoutDashboard, LogOut, ReceiptText } from "lucide-react"
import type { ReactNode } from "react"
import { NavLink, Outlet } from "react-router"
import { useAuth } from "../auth/AuthContext"

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

// Cada tela nova entra aqui e aparece na barra lateral (computador) e na barra de baixo (celular)
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Painel", icon: <LayoutDashboard aria-hidden className="size-5" /> },
  { to: "/lancamentos", label: "Lançamentos", icon: <ReceiptText aria-hidden className="size-5" /> },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-surface-raised text-ink shadow-sm ring-1 ring-border" : "text-ink-secondary hover:bg-surface hover:text-ink"
  }`

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      {/* Barra lateral (tela média pra cima) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border px-3 py-5 md:flex">
        <p className="px-3 text-lg font-semibold tracking-tight text-ink">Saldo</p>
        <nav aria-label="Principal" className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-border px-3 pt-4">
          <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
          <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-ink"
          >
            <LogOut aria-hidden className="size-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Topo (celular) */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-page/95 px-4 py-3 md:hidden">
        <p className="text-lg font-semibold tracking-tight text-ink">Saldo</p>
        <button type="button" onClick={logout} aria-label="Sair" className="rounded-lg p-2 text-ink-secondary hover:bg-surface">
          <LogOut aria-hidden className="size-5" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 sm:px-6 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      {/* Navegação de baixo (celular) */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-10 grid border-t border-border bg-page/95 px-1 pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? "text-action" : "text-ink-muted"}`
            }
          >
            {item.icon}
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
