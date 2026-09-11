import type { Category } from "../lib/types"

interface CategorySelectProps {
  categories: Category[]
  value: string | null
  onChange: (categoryId: string | null) => void
  label: string
  // Texto da opção vazia ("Sem categoria" na edição, "Todas" no filtro)
  emptyLabel?: string
  disabled?: boolean
  className?: string
}

// Saídas e entradas separadas em grupos, igual a tela de categorias
export function CategorySelect({ categories, value, onChange, label, emptyLabel = "Sem categoria", disabled, className = "" }: CategorySelectProps) {
  const expenses = categories.filter((category) => category.kind === "EXPENSE")
  const incomes = categories.filter((category) => category.kind === "INCOME")

  return (
    <select
      aria-label={label}
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value || null)}
      className={`h-9 w-full min-w-0 rounded-lg border border-border bg-surface-raised px-2 text-sm text-ink outline-none focus:border-action focus:ring-2 focus:ring-action/20 disabled:opacity-60 ${className}`}
    >
      <option value="">{emptyLabel}</option>
      <optgroup label="Saídas">
        {expenses.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Entradas">
        {incomes.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </optgroup>
    </select>
  )
}
