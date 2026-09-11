import { Route, Routes } from "react-router"
import { RequireAuth } from "./auth/RequireAuth"
import { Layout } from "./components/Layout"
import { AccountsPage } from "./pages/AccountsPage"
import { BudgetsPage } from "./pages/BudgetsPage"
import { CategoriesPage } from "./pages/CategoriesPage"
import { DashboardPage } from "./pages/DashboardPage"
import { ImportPage } from "./pages/ImportPage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { TransactionsPage } from "./pages/TransactionsPage"

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
        <Route index element={<DashboardPage />} />
        <Route path="lancamentos" element={<TransactionsPage />} />
        <Route path="importar" element={<ImportPage />} />
        <Route path="categorias" element={<CategoriesPage />} />
        <Route path="orcamentos" element={<BudgetsPage />} />
        <Route path="contas" element={<AccountsPage />} />
      </Route>
    </Routes>
  )
}
