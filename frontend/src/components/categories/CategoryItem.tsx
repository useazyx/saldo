import { useMutation } from "@tanstack/react-query"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../../auth/AuthContext"
import { categoryColorVar } from "../../lib/categoryColors"
import type { Category, CategoryColor } from "../../lib/types"
import { useInvalidateFinance } from "../../lib/useInvalidateFinance"
import { Button } from "../ui/Button"
import { ColorPicker } from "./ColorPicker"

interface CategoryItemProps {
  category: Category
  onError: (message: string) => void
}

// Uma categoria na lista: renomeia, troca a cor ou apaga (avisando que os lançamentos ficam sem categoria)
export function CategoryItem({ category, onError }: CategoryItemProps) {
  const { request } = useAuth()
  const invalidate = useInvalidateFinance()
  const [mode, setMode] = useState<"view" | "edit" | "delete">("view")
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState<CategoryColor>(category.color)

  const update = useMutation({
    mutationFn: () => request(`/categories/${category.id}`, { method: "PATCH", body: { name: name.trim(), color } }),
    onSuccess: async () => {
      setMode("view")
      await invalidate()
    },
    onError: (error) => onError(error.message),
  })

  const remove = useMutation({
    mutationFn: () => request(`/categories/${category.id}`, { method: "DELETE" }),
    onSuccess: invalidate,
    onError: (error) => onError(error.message),
  })

  if (mode === "edit") {
    return (
      <li className="flex flex-col gap-3 py-3">
        <input
          aria-label="Nome da categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-raised px-3 text-sm text-ink outline-none focus:border-action focus:ring-2 focus:ring-action/20"
        />
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <Button onClick={() => update.mutate()} loading={update.isPending} disabled={name.trim().length < 2}>
            Salvar
          </Button>
          <Button variant="ghost" onClick={() => setMode("view")}>
            Cancelar
          </Button>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: categoryColorVar(category.color) }} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{category.name}</p>
          <p className="text-xs text-ink-muted">
            {category.transactions_count === 1 ? "1 lançamento" : `${category.transactions_count} lançamentos`}
          </p>
        </div>
      </div>

      {mode === "delete" ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-ink-muted sm:inline">Os lançamentos ficam sem categoria.</span>
          <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} className="font-medium text-expense hover:underline">
            Apagar
          </button>
          <button type="button" onClick={() => setMode("view")} className="text-ink-muted hover:text-ink">
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            aria-label={`Editar ${category.name}`}
            onClick={() => setMode("edit")}
            className="rounded-md p-1.5 text-ink-muted hover:bg-page hover:text-ink"
          >
            <Pencil aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Apagar ${category.name}`}
            onClick={() => setMode("delete")}
            className="rounded-md p-1.5 text-ink-muted hover:bg-danger-bg hover:text-expense"
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      )}
    </li>
  )
}
