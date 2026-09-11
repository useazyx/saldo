import { useId, type ReactNode, type SelectHTMLAttributes } from "react"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  // Esconde o rótulo na tela (continua lá pro leitor de tela)
  hideLabel?: boolean
  children: ReactNode
}

export function Select({ label, hideLabel, children, className = "", ...props }: SelectProps) {
  const id = useId()

  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-sm font-medium text-ink-secondary"}>
        {label}
      </label>
      <select
        {...props}
        id={id}
        className="h-10 w-full min-w-0 rounded-lg border border-border bg-surface-raised px-3 text-sm text-ink outline-none transition-colors focus:border-action focus:ring-2 focus:ring-action/20 disabled:opacity-60"
      >
        {children}
      </select>
    </div>
  )
}
