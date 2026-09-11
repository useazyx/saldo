import { useId, type InputHTMLAttributes } from "react"

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, className = "", ...props }: TextFieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-ink-secondary">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className="h-10 rounded-lg border border-border bg-surface-raised px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-action focus:ring-2 focus:ring-action/20 aria-invalid:border-expense"
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-expense">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
