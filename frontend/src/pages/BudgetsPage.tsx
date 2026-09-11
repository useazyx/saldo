import { useMutation } from "@tanstack/react-query"
import { Copy, X } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useAuth } from "../auth/AuthContext"
import { BudgetMeter } from "../components/BudgetMeter"
import { CategorySelect } from "../components/CategorySelect"
import { MonthPicker } from "../components/MonthPicker"
import { Alert } from "../components/ui/Alert"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { TextField } from "../components/ui/TextField"
import { errorMessage } from "../lib/api"
import { currentMonth, formatMonth, parseMoneyInput, shiftMonth } from "../lib/format"
import { useBudgets, useCategories } from "../lib/queries"
import type { Budget } from "../lib/types"
import { useInvalidateFinance } from "../lib/useInvalidateFinance"

export function BudgetsPage() {
  const { request } = useAuth()
  const invalidate = useInvalidateFinance()
  const [month, setMonth] = useState(currentMonth)
  const budgets = useBudgets(month)
  const categories = useCategories()

  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [limit, setLimit] = useState("")
  const [limitError, setLimitError] = useState<string | null>(null)

  const monthName = formatMonth(month).split(" de ")[0]
  // Orçamento só faz sentido pra saída
  const expenseCategories = (categories.data ?? []).filter((category) => category.kind === "EXPENSE")

  const upsert = useMutation({
    mutationFn: (payload: { category_id: string; limit_cents: number }) =>
      request("/budgets", { method: "PUT", body: { ...payload, month } }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (budgetId: string) => request(`/budgets/${budgetId}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })

  // Copia os limites do mês anterior (os que já existem neste mês ficam como estão)
  const copyPrevious = useMutation({
    mutationFn: async () => {
      const previous = await request<Budget[]>("/budgets", { query: { month: shiftMonth(month, -1) } })
      const existing = new Set((budgets.data ?? []).map((budget) => budget.category.id))
      const missing = previous.filter((budget) => !existing.has(budget.category.id))

      for (const budget of missing) {
        await request("/budgets", {
          method: "PUT",
          body: { category_id: budget.category.id, month, limit_cents: budget.limit_cents },
        })
      }
      return missing.length
    },
    onSuccess: invalidate,
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const cents = parseMoneyInput(limit)
    if (!cents || cents < 100) {
      setLimitError("Informa um limite de pelo menos R$ 1,00")
      return
    }
    setLimitError(null)
    if (!categoryId) return

    upsert.mutate(
      { category_id: categoryId, limit_cents: cents },
      {
        onSuccess: () => {
          setLimit("")
          setCategoryId(null)
        },
      }
    )
  }

  const error = budgets.error ?? upsert.error ?? remove.error ?? copyPrevious.error

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Orçamentos</h1>
          <p className="mt-1 text-sm text-ink-muted">Um limite por categoria de saída, mês a mês.</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </header>

      {error && <Alert>{errorMessage(error)}</Alert>}

      <Card title={`Definir limite em ${monthName}`} description="Definir de novo uma categoria que já tem limite troca o valor.">
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-start">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-secondary">Categoria</span>
            <CategorySelect
              label="Categoria do orçamento"
              categories={expenseCategories}
              value={categoryId}
              onChange={setCategoryId}
              emptyLabel="Escolha..."
              className="h-10"
            />
          </div>
          <TextField
            label="Limite (R$)"
            inputMode="decimal"
            placeholder="0,00"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            error={limitError ?? undefined}
          />
          <Button type="submit" className="sm:mt-7" loading={upsert.isPending} disabled={!categoryId}>
            Definir limite
          </Button>
        </form>
      </Card>

      <Card
        title={`Limites de ${monthName}`}
        action={
          <Button
            variant="secondary"
            icon={<Copy aria-hidden className="size-4" />}
            onClick={() => copyPrevious.mutate()}
            loading={copyPrevious.isPending}
          >
            Copiar do mês anterior
          </Button>
        }
      >
        {copyPrevious.isSuccess && (
          <div className="mb-4">
            <Alert tone="info">
              {copyPrevious.data === 0 ? "Nada novo pra copiar do mês anterior." : `${copyPrevious.data} limites copiados.`}
            </Alert>
          </div>
        )}

        {budgets.data?.length ? (
          <ul className="grid gap-6 md:grid-cols-2">
            {budgets.data.map((budget) => (
              <li key={budget.id} className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <BudgetMeter budget={budget} />
                </div>
                <button
                  type="button"
                  aria-label={`Tirar orçamento de ${budget.category.name}`}
                  onClick={() => remove.mutate(budget.id)}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-danger-bg hover:text-expense"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nenhum limite definido em {monthName}.</p>
        )}
      </Card>
    </div>
  )
}
