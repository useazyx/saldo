import { useState, type FormEvent } from "react"
import { useAuth } from "../../auth/AuthContext"
import { errorMessage } from "../../lib/api"
import { parseMoneyInput, todayDate } from "../../lib/format"
import type { Account, Category } from "../../lib/types"
import { CategorySelect } from "../CategorySelect"
import { Alert } from "../ui/Alert"
import { Button } from "../ui/Button"
import { SegmentedControl } from "../ui/SegmentedControl"
import { Select } from "../ui/Select"
import { TextField } from "../ui/TextField"

interface NewTransactionFormProps {
  accounts: Account[]
  categories: Category[]
  onCreated: () => void
  onCancel: () => void
}

// Lançamento feito na mão: dinheiro vivo, Pix que não veio no extrato etc.
export function NewTransactionForm({ accounts, categories, onCreated, onCancel }: NewTransactionFormProps) {
  const { request } = useAuth()
  const [kind, setKind] = useState<"expense" | "income">("expense")
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "")
  const [occurredOn, setOccurredOn] = useState(todayDate)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (accounts.length === 0) {
    return <Alert tone="info">Cadastre uma conta antes de lançar (Contas, no menu).</Alert>
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitError(null)

    const cents = parseMoneyInput(amount)
    const nextErrors = {
      description: description.trim().length < 2 ? "Descreve em pelo menos 2 letras" : undefined,
      amount: !cents || cents <= 0 ? "Informa um valor maior que zero (ex.: 45,90)" : undefined,
    }
    setErrors(nextErrors)
    if (nextErrors.description || nextErrors.amount || !cents) return

    setSaving(true)
    try {
      await request("/transactions", {
        method: "POST",
        body: {
          account_id: accountId,
          occurred_on: occurredOn,
          description: description.trim(),
          // Saída vai negativa, entrada positiva
          amount_cents: kind === "expense" ? -cents : cents,
          category_id: categoryId,
          notes: notes.trim() || null,
        },
      })
      onCreated()
    } catch (caught) {
      setSubmitError(errorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {submitError && <Alert>{submitError}</Alert>}

      <SegmentedControl
        label="Tipo do lançamento"
        value={kind}
        onChange={setKind}
        options={[
          { value: "expense", label: "Saída" },
          { value: "income", label: "Entrada" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          className="sm:col-span-2"
        />
        <TextField
          label="Valor (R$)"
          inputMode="decimal"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
        />
        <TextField label="Data" type="date" value={occurredOn} max={todayDate()} onChange={(e) => setOccurredOn(e.target.value)} />
        <Select label="Conta" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-secondary">Categoria</span>
          <CategorySelect
            label="Categoria"
            categories={categories}
            value={categoryId}
            onChange={setCategoryId}
            emptyLabel="Deixar as regras decidirem"
            className="h-10"
          />
        </div>
        <TextField label="Anotação (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="sm:col-span-2" />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          Salvar lançamento
        </Button>
      </div>
    </form>
  )
}
