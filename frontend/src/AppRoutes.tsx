import { LoaderCircle } from "lucide-react"
import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router"
import { RequireAuth } from "./auth/RequireAuth"
import { Layout } from "./components/Layout"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"

// Cada tela logada vira um pedaço separado do bundle: o gráfico (Recharts) só baixa quando abre o painel
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })))
const TransactionsPage = lazy(() =>
  import("./pages/TransactionsPage").then((module) => ({ default: module.TransactionsPage }))
)
const ImportPage = lazy(() => import("./pages/ImportPage").then((module) => ({ default: module.ImportPage })))
const CategoriesPage = lazy(() => import("./pages/CategoriesPage").then((module) => ({ default: module.CategoriesPage })))
const BudgetsPage = lazy(() => import("./pages/BudgetsPage").then((module) => ({ default: module.BudgetsPage })))
const AccountsPage = lazy(() => import("./pages/AccountsPage").then((module) => ({ default: module.AccountsPage })))

function PageLoading() {
  return (
    <div className="grid place-items-center py-20" role="status" aria-label="Carregando página">
      <LoaderCircle aria-hidden className="size-6 animate-spin text-ink-muted" />
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/criar-conta" element={<RegisterPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Suspense fallback={<PageLoading />}><DashboardPage /></Suspense>} />
        <Route path="lancamentos" element={<Suspense fallback={<PageLoading />}><TransactionsPage /></Suspense>} />
        <Route path="importar" element={<Suspense fallback={<PageLoading />}><ImportPage /></Suspense>} />
        <Route path="categorias" element={<Suspense fallback={<PageLoading />}><CategoriesPage /></Suspense>} />
        <Route path="orcamentos" element={<Suspense fallback={<PageLoading />}><BudgetsPage /></Suspense>} />
        <Route path="contas" element={<Suspense fallback={<PageLoading />}><AccountsPage /></Suspense>} />
      </Route>
    </Routes>
  )
}
