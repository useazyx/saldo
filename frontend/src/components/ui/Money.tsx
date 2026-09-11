import { formatMoney, formatSignedMoney } from "../../lib/format"

interface MoneyProps {
  cents: number
  // Com sinal e cor: verde entrando, vermelho saindo
  signed?: boolean
  className?: string
}

export function Money({ cents, signed = false, className = "" }: MoneyProps) {
  const tone = !signed || cents === 0 ? "" : cents > 0 ? "text-income" : "text-expense"

  return (
    <span className={`tabular whitespace-nowrap ${tone} ${className}`}>
      {signed ? formatSignedMoney(cents) : formatMoney(cents)}
    </span>
  )
}
