import { useMutation } from "@tanstack/react-query"
import { Landmark, Pencil, Trash2 } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { useAuth } from "../auth/AuthContext"
import { Alert } from "../components/ui/Alert"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { Money } from "../components/ui/Money"
import { TextField } from "../components/ui/TextField"
import { errorMessage } from "../lib/api"
import { useAccounts } from "../lib/queries"
import type { Account } from "../lib/types"
import { useInvalidateFinance } from "../lib/useInvalidateFinance"

export function AccountsPage() {
  const { request } = useAuth()
  const invalidate = useInvalidateFinance()
  const accounts = useAccounts()
  const [name, setName] = useState("")

  const create = useMutation({
    mutationFn: () => request("/accounts", { method: "POST", body: { name: name.trim() } }),
    onSuccess: async () => {
      setName("")
      await invalidate()
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (name.trim().length >= 2) create.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Contas</h1>
        <p className="mt-1 text-sm text-ink-muted">Cada conta ou cartão recebe os extratos dele. O saldo é a soma dos lançamentos.</p>
      </header>

      {(accounts.error || create.error) && <Alert>{errorMessage(accounts.error ?? create.error)}</Alert>}

      <Card title="Nova conta">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <TextField label="Nome da conta" placeholder="Ex.: Cartão Nubank" value={name} onChange={(e) => setName(e.target.value)} className="min-w-56 flex-1" />
          <Button type="submit" loading={create.isPending} disabled={name.trim().length < 2}>
            Criar conta
          </Button>
        </form>
      </Card>

      {accounts.data?.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.data.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </ul>
      ) : (
        accounts.data && <p className="text-sm text-ink-muted">Nenhuma conta ainda. Crie a primeira pra importar um extrato.</p>
      )}
    </div>
  )
}

function AccountCard({ account }: { account: Account }) {
  const { request } = useAuth()
  const invalidate = useInvalidateFinance()
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view")
  const [name, setName] = useState(account.name)

  const rename = useMutation({
    mutationFn: () => request(`/accounts/${account.id}`, { method: "PATCH", body: { name: name.trim() } }),
    onSuccess: async () => {
      setMode("view")
      await invalidate()
    },
  })

  const remove = useMutation({
    mutationFn: () => request(`/accounts/${account.id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  })

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-page text-ink-secondary ring-1 ring-border">
            <Landmark aria-hidden className="size-4" />
          </span>
          {mode === "edit" ? (
            <input
              aria-label="Novo nome da conta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface-raised px-2 text-sm text-ink outline-none focus:border-action focus:ring-2 focus:ring-action/20"
            />
          ) : (
            <p className="truncate font-medium text-ink">{account.name}</p>
          )}
        </div>
        {mode === "view" && (
          <div className="flex shrink-0 gap-1">
            <button type="button" aria-label={`Renomear ${account.name}`} onClick={() => setMode("edit")} className="rounded-md p-1.5 text-ink-muted hover:bg-page hover:text-ink">
              <Pencil aria-hidden className="size-4" />
            </button>
            <button type="button" aria-label={`Apagar ${account.name}`} onClick={() => setMode("delete")} className="rounded-md p-1.5 text-ink-muted hover:bg-danger-bg hover:text-expense">
              <Trash2 aria-hidden className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-ink-muted">Saldo</p>
        <p className="text-2xl font-semibold tracking-tight">
          <Money cents={account.balance_cents} signed />
        </p>
        <Link to={`/lancamentos?conta=${account.id}`} className="text-sm text-action hover:underline">
          {account.transactions_count === 1 ? "1 lançamento" : `${account.transactions_count} lançamentos`}
        </Link>
      </div>

      {(rename.error || remove.error) && <Alert>{errorMessage(rename.error ?? remove.error)}</Alert>}

      {mode === "edit" && (
        <div className="flex gap-2">
          <Button onClick={() => rename.mutate()} loading={rename.isPending} disabled={name.trim().length < 2}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={() => setMode("view")}>
            Cancelar
          </Button>
        </div>
      )}

      {mode === "delete" && (
        <Alert tone="warning">
          <p>
            Apagar a conta também apaga{" "}
            {account.transactions_count === 1 ? "o lançamento dela" : `os ${account.transactions_count} lançamentos dela`}.
          </p>
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} className="font-medium text-expense hover:underline">
              Apagar conta
            </button>
            <button type="button" onClick={() => setMode("view")} className="text-ink-secondary hover:text-ink">
              Cancelar
            </button>
          </div>
        </Alert>
      )}
    </li>
  )
}
