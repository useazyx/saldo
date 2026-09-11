import { Plus, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { MonthPicker } from "../components/MonthPicker"
import { NewTransactionForm } from "../components/transactions/NewTransactionForm"
import { TransactionCard, TransactionTableRow } from "../components/transactions/TransactionRow"
import { Alert } from "../components/ui/Alert"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { Money } from "../components/ui/Money"
import { SegmentedControl } from "../components/ui/SegmentedControl"
import { Select } from "../components/ui/Select"
import { errorMessage } from "../lib/api"
import { currentMonth, monthBounds } from "../lib/format"
import { useAccounts, useCategories, useTransactions } from "../lib/queries"
import { useDebouncedValue } from "../lib/useDebouncedValue"
import { useInvalidateFinance } from "../lib/useInvalidateFinance"

const PAGE_SIZE = 30

type KindFilter = "all" | "income" | "expense"

// Os filtros moram na URL: dá pra voltar, recarregar e mandar o link (o painel usa isso)
export function TransactionsPage() {
  const [params, setParams] = useSearchParams()
  const month = params.get("mes") ?? currentMonth()
  const accountId = params.get("conta") ?? ""
  const categoryId = params.get("categoria") ?? ""
  const kind = (params.get("tipo") as KindFilter | null) ?? "all"
  const page = Number(params.get("pagina") ?? "1")

  const [search, setSearch] = useState(params.get("busca") ?? "")
  const debouncedSearch = useDebouncedValue(search)
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const invalidate = useInvalidateFinance()

  // Muda um filtro e volta pra primeira página
  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== "pagina") next.delete("pagina")
    setParams(next, { replace: true })
  }

  // Só quando a busca "assenta" (depois da pausa na digitação) ela vai pra URL
  useEffect(() => {
    if ((params.get("busca") ?? "") !== debouncedSearch) updateParam("busca", debouncedSearch.trim() || null)
  }, [debouncedSearch])

  const accounts = useAccounts()
  const categories = useCategories()
  const transactions = useTransactions({
    ...monthBounds(month),
    account_id: accountId || undefined,
    category_id: categoryId || undefined,
    kind: kind === "all" ? undefined : kind,
    search: params.get("busca") || undefined,
    page,
    page_size: PAGE_SIZE,
  })

  const list = transactions.data
  const categoryOptions = categories.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Lançamentos</h1>
          <p className="mt-1 text-sm text-ink-muted">Tudo que entrou e saiu, com a categoria de cada um.</p>
        </div>
        <Button icon={<Plus aria-hidden className="size-4" />} onClick={() => setCreating(true)} disabled={creating}>
          Novo lançamento
        </Button>
      </header>

      {creating && accounts.data && (
        <Card title="Novo lançamento">
          <NewTransactionForm
            accounts={accounts.data}
            categories={categoryOptions}
            onCancel={() => setCreating(false)}
            onCreated={() => {
              setCreating(false)
              invalidate()
            }}
          />
        </Card>
      )}

      {/* Filtros numa linha só, acima do que eles filtram */}
      <section aria-label="Filtros" className="flex flex-wrap items-end gap-3">
        <MonthPicker value={month} onChange={(value) => updateParam("mes", value)} />
        <SegmentedControl
          label="Tipo"
          value={kind}
          onChange={(value) => updateParam("tipo", value === "all" ? null : value)}
          options={[
            { value: "all", label: "Tudo" },
            { value: "income", label: "Entradas" },
            { value: "expense", label: "Saídas" },
          ]}
        />
        <Select label="Conta" hideLabel value={accountId} onChange={(e) => updateParam("conta", e.target.value || null)} className="w-44">
          <option value="">Todas as contas</option>
          {accounts.data?.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <div className="w-52">
          <select
            aria-label="Categoria"
            value={categoryId}
            onChange={(e) => updateParam("categoria", e.target.value || null)}
            className="h-10 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-ink outline-none focus:border-action focus:ring-2 focus:ring-action/20"
          >
            <option value="">Todas as categorias</option>
            <option value="none">Sem categoria</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Buscar na descrição</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar na descrição"
            className="h-10 w-full rounded-lg border border-border bg-surface-raised pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-action focus:ring-2 focus:ring-action/20"
          />
        </label>
      </section>

      {(transactions.error || actionError) && <Alert>{actionError ?? errorMessage(transactions.error)}</Alert>}

      {list && (
        <div className={`flex flex-col gap-4 transition-opacity ${transactions.isPlaceholderData ? "opacity-60" : ""}`}>
          <dl className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
            <div>
              <dt className="text-ink-muted">Entradas</dt>
              <dd className="mt-0.5 font-semibold"><Money cents={list.totals.income_cents} signed /></dd>
            </div>
            <div>
              <dt className="text-ink-muted">Saídas</dt>
              <dd className="mt-0.5 font-semibold"><Money cents={list.totals.expense_cents} signed /></dd>
            </div>
            <div>
              <dt className="text-ink-muted">Saldo</dt>
              <dd className="mt-0.5 font-semibold"><Money cents={list.totals.net_cents} signed /></dd>
            </div>
          </dl>

          {list.transactions.length === 0 ? (
            <Card>
              <p className="py-8 text-center text-sm text-ink-muted">Nenhum lançamento com esses filtros.</p>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <table className="hidden w-full md:table">
                <caption className="sr-only">Lançamentos</caption>
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                    <th scope="col" className="py-3 pl-4 pr-3">Data</th>
                    <th scope="col" className="py-3 pr-3">Descrição</th>
                    <th scope="col" className="py-3 pr-3">Conta</th>
                    <th scope="col" className="py-3 pr-3">Categoria</th>
                    <th scope="col" className="py-3 pr-3 text-right">Valor</th>
                    <th scope="col" className="py-3 pr-4"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {list.transactions.map((transaction) => (
                    <TransactionTableRow key={transaction.id} transaction={transaction} categories={categoryOptions} onError={setActionError} />
                  ))}
                </tbody>
              </table>
              <ul className="md:hidden">
                {list.transactions.map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} categories={categoryOptions} onError={setActionError} />
                ))}
              </ul>
            </div>
          )}

          {list.total_pages > 1 && (
            <nav aria-label="Paginação" className="flex items-center justify-between gap-3 text-sm text-ink-secondary">
              <span>
                Página {list.current_page} de {list.total_pages} · {list.total} lançamentos
              </span>
              <span className="flex gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => updateParam("pagina", String(page - 1))}>
                  Anterior
                </Button>
                <Button variant="secondary" disabled={page >= list.total_pages} onClick={() => updateParam("pagina", String(page + 1))}>
                  Próxima
                </Button>
              </span>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
