import { useState } from "react"
import { CategoryItem } from "../components/categories/CategoryItem"
import { NewCategoryForm } from "../components/categories/NewCategoryForm"
import { RulesCard } from "../components/categories/RulesCard"
import { Alert } from "../components/ui/Alert"
import { Card } from "../components/ui/Card"
import { errorMessage } from "../lib/api"
import { useCategories } from "../lib/queries"

export function CategoriesPage() {
  const categories = useCategories()
  const [actionError, setActionError] = useState<string | null>(null)

  const expenses = categories.data?.filter((category) => category.kind === "EXPENSE") ?? []
  const incomes = categories.data?.filter((category) => category.kind === "INCOME") ?? []

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Categorias e regras</h1>
        <p className="mt-1 text-sm text-ink-muted">Como o seu dinheiro é agrupado, e o que categoriza sozinho na importação.</p>
      </header>

      {(categories.error || actionError) && <Alert>{actionError ?? errorMessage(categories.error)}</Alert>}

      <Card title="Categorias">
        <div className="flex flex-col gap-6">
          <NewCategoryForm />
          <div className="grid gap-6 border-t border-border pt-4 md:grid-cols-2">
            <section aria-labelledby="expenses-title">
              <h3 id="expenses-title" className="text-xs font-medium uppercase tracking-wide text-ink-muted">Saídas</h3>
              <ul className="divide-y divide-border">
                {expenses.map((category) => (
                  <CategoryItem key={category.id} category={category} onError={setActionError} />
                ))}
              </ul>
            </section>
            <section aria-labelledby="incomes-title">
              <h3 id="incomes-title" className="text-xs font-medium uppercase tracking-wide text-ink-muted">Entradas</h3>
              <ul className="divide-y divide-border">
                {incomes.map((category) => (
                  <CategoryItem key={category.id} category={category} onError={setActionError} />
                ))}
              </ul>
            </section>
          </div>
        </div>
      </Card>

      <RulesCard categories={categories.data ?? []} />
    </div>
  )
}
