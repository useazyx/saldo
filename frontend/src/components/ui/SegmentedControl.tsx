interface Option<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}

// Botões lado a lado pra escolher uma opção (tipo "Tudo | Entradas | Saídas")
export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 rounded-lg border border-border bg-surface-raised p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-md px-3 text-sm font-medium transition-colors ${
            value === option.value ? "bg-page text-ink shadow-sm ring-1 ring-border" : "text-ink-secondary hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
