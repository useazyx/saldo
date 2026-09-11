import { useMutation } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../../auth/AuthContext"
import { formatDate } from "../../lib/format"
import type { Category, Transaction } from "../../lib/types"
import { useInvalidateFinance } from "../../lib/useInvalidateFinance"
import { CategorySelect } from "../CategorySelect"
import { Money } from "../ui/Money"

interface TransactionRowProps {
  transaction: Transaction
  categories: Category[]
  onError: (message: string) => void
}

// Uma linha do extrato: troca de categoria na hora e apaga com confirmação ali mesmo (sem janela do navegador)
export function useTransactionActions({ transaction, onError }: Omit<TransactionRowProps, "categories">) {
  const { request } = useAuth()
  const invalidate = useInvalidateFinance()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const updateCategory = useMutation({
    mutationFn: (categoryId: string | null) =>
      request(`/transactions/${transaction.id}`, { method: "PATCH", body: { category_id: categoryId } }),
    onSuccess: invalidate,
    onError: (error) => onError(error.message),
  })

  const remove = useMutation({
    mutationFn: () => request(`/transactions/${transaction.id}`, { method: "DELETE" }),
    onSuccess: invalidate,
    onError: (error) => onError(error.message),
  })

  return { updateCategory, remove, confirmingDelete, setConfirmingDelete }
}

function DeleteControl({ actions, description }: { actions: ReturnType<typeof useTransactionActions>; description: string }) {
  if (actions.confirmingDelete) {
    return (
      <span className="inline-flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => actions.remove.mutate()}
          disabled={actions.remove.isPending}
          className="font-medium text-expense hover:underline"
        >
          Apagar
        </button>
        <button type="button" onClick={() => actions.setConfirmingDelete(false)} className="text-ink-muted hover:text-ink">
          Cancelar
        </button>
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-label={`Apagar ${description}`}
      onClick={() => actions.setConfirmingDelete(true)}
      className="rounded-md p-1.5 text-ink-muted hover:bg-danger-bg hover:text-expense"
    >
      <Trash2 aria-hidden className="size-4" />
    </button>
  )
}

export function TransactionTableRow({ transaction, categories, onError }: TransactionRowProps) {
  const actions = useTransactionActions({ transaction, onError })

  return (
    <tr className="border-t border-border align-middle">
      <td className="tabular whitespace-nowrap py-3 pl-4 pr-3 text-sm text-ink-secondary">{formatDate(transaction.occurred_on)}</td>
      <td className="py-3 pr-3">
        <p className="text-sm font-medium text-ink">{transaction.description}</p>
        {transaction.notes && <p className="text-xs text-ink-muted">{transaction.notes}</p>}
      </td>
      <td className="whitespace-nowrap py-3 pr-3 text-sm text-ink-secondary">{transaction.account.name}</td>
      <td className="w-52 py-3 pr-3">
        <CategorySelect
          label={`Categoria de ${transaction.description}`}
          categories={categories}
          value={transaction.category?.id ?? null}
          onChange={(categoryId) => actions.updateCategory.mutate(categoryId)}
          disabled={actions.updateCategory.isPending}
        />
      </td>
      <td className="py-3 pr-3 text-right text-sm font-medium">
        <Money cents={transaction.amount_cents} signed />
      </td>
      <td className="w-24 py-3 pr-4 text-right">
        <DeleteControl actions={actions} description={transaction.description} />
      </td>
    </tr>
  )
}

export function TransactionCard({ transaction, categories, onError }: TransactionRowProps) {
  const actions = useTransactionActions({ transaction, onError })

  return (
    <li className="border-t border-border px-4 py-3 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{transaction.description}</p>
          <p className="text-xs text-ink-muted">
            {formatDate(transaction.occurred_on)} · {transaction.account.name}
          </p>
        </div>
        <Money cents={transaction.amount_cents} signed className="text-sm font-medium" />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <CategorySelect
          label={`Categoria de ${transaction.description}`}
          categories={categories}
          value={transaction.category?.id ?? null}
          onChange={(categoryId) => actions.updateCategory.mutate(categoryId)}
          disabled={actions.updateCategory.isPending}
        />
        <DeleteControl actions={actions} description={transaction.description} />
      </div>
    </li>
  )
}
