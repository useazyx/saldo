import { LoaderCircle } from "lucide-react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "secondary" | "ghost" | "danger"

const VARIANTS: Record<Variant, string> = {
  primary: "bg-action text-white hover:bg-action-strong shadow-sm",
  secondary: "bg-surface-raised text-ink border border-border hover:bg-page",
  ghost: "text-ink-secondary hover:bg-page hover:text-ink",
  danger: "bg-surface-raised text-expense border border-border hover:bg-danger-bg",
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
}

export function Button({ variant = "primary", loading, icon, children, className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {loading ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}
