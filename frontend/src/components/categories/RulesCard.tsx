import { useMutation } from "@tanstack/react-query"
import { ArrowRight, Trash2, Wand2 } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useAuth } from "../../auth/AuthContext"
import { errorMessage } from "../../lib/api"
import { useRules } from "../../lib/queries"
import type { Category } from "../../lib/types"
import { useInvalidateFinance } from "../../lib/useInvalidateFinance"
import { CategorySelect } from "../CategorySelect"
import { Alert } from "../ui/Alert"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import { CategoryBadge } from "../ui/CategoryBadge"
import { TextField } from "../ui/TextField"

export function RulesCard({ categories }: { categories: Category[] }) {
  const { request } = useAuth()
  const invalidate = useInvalidateFinance()
  const rules = useRules()

  const [pattern, setPattern] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [applyToExisting, setApplyToExisting] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)

  const refreshRules = async () => {
    await invalidate()
    await rules.refetch()
  }

  const create = useMutation({
    mutationFn: () =>
      request<{ categorized: number }>("/rules", {
        method: "POST",
        body: { pattern: pattern.trim(), category_id: categoryId, apply_to_existing: applyToExisting },
      }),
    onSuccess: async (data) => {
      setPattern("")
      setFeedback(applyToExisting ? categorizedMessage(data.categorized) : "Regra criada. Vale para as próximas importações.")
      await refreshRules()
    },
  })

  const apply = useMutation({
    mutationFn: () => request<{ categorized: number }>("/rules/apply", { method: "POST" }),
    onSuccess: async (data) => {
      setFeedback(categorizedMessage(data.categorized))
      await refreshRules()
    },
  })

  const remove = useMutation({
    mutationFn: (ruleId: string) => request(`/rules/${ruleId}`, { method: "DELETE" }),
    onSuccess: refreshRules,
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFeedback(null)
    if (pattern.trim().length >= 2 && categoryId) create.mutate()
  }

  const error = create.error ?? apply.error ?? remove.error

  return (
    <Card
      title="Regras automáticas"
      description="Se a descrição contém o texto, o lançamento ganha a categoria. Quando duas regras servem, a mais específica ganha."
      action={
        <Button variant="secondary" icon={<Wand2 aria-hidden className="size-4" />} onClick={() => apply.mutate()} loading={apply.isPending}>
          Aplicar nos sem categoria
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <Alert>{errorMessage(error)}</Alert>}
        {feedback && <Alert tone="info">{feedback}</Alert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-page p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <TextField label="Quando a descrição contém" placeholder="Ex.: ifood" value={pattern} onChange={(e) => setPattern(e.target.value)} />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-secondary">Categoria</span>
              <CategorySelect label="Categoria da regra" categories={categories} value={categoryId} onChange={setCategoryId} emptyLabel="Escolha..." className="h-10" />
            </div>
            <Button type="submit" loading={create.isPending} disabled={pattern.trim().length < 2 || !categoryId}>
              Criar regra
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input type="checkbox" checked={applyToExisting} onChange={(e) => setApplyToExisting(e.target.checked)} className="size-4 accent-action" />
            Aplicar também nos lançamentos que estão sem categoria
          </label>
        </form>

        {rules.data?.length ? (
          <ul className="divide-y divide-border">
            {rules.data.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between gap-3 py-2.5">
                <p className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md bg-page px-2 py-0.5 font-mono text-ink ring-1 ring-border">{rule.pattern}</span>
                  <ArrowRight aria-hidden className="size-4 text-ink-muted" />
                  <CategoryBadge category={rule.category} />
                </p>
                <button
                  type="button"
                  aria-label={`Apagar regra ${rule.pattern}`}
                  onClick={() => remove.mutate(rule.id)}
                  className="rounded-md p-1.5 text-ink-muted hover:bg-danger-bg hover:text-expense"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nenhuma regra ainda.</p>
        )}
      </div>
    </Card>
  )
}

const categorizedMessage = (count: number) =>
  count === 0
    ? "Nenhum lançamento sem categoria bateu com as regras."
    : count === 1
      ? "1 lançamento ganhou categoria."
      : `${count} lançamentos ganharam categoria.`
