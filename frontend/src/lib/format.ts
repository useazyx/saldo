// Tudo que aparece na tela sai em português do Brasil

const moneyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const compactMoneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
})
const percentFormatter = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 })
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
const shortMonthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })

// 123456 -> "R$ 1.234,56"
export const formatMoney = (cents: number) => moneyFormatter.format(cents / 100).replace(/ /g, " ")

// 123456 -> "R$ 1,2 mil" (eixo de gráfico)
export const formatCompactMoney = (cents: number) =>
  compactMoneyFormatter.format(cents / 100).replace(/ /g, " ")

// Com sinal explícito: "+R$ 50,00" / "−R$ 50,00"
export const formatSignedMoney = (cents: number) =>
  `${cents > 0 ? "+" : cents < 0 ? "−" : ""}${formatMoney(Math.abs(cents))}`

// "2026-08-03" -> "03/08/2026"
export const formatDate = (date: string) => {
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

// "2026-08" -> "agosto de 2026"
export const formatMonth = (month: string) => monthFormatter.format(new Date(`${month}-01T00:00:00Z`))

// "2026-08" -> "ago"
export const formatShortMonth = (month: string) =>
  shortMonthFormatter.format(new Date(`${month}-01T00:00:00Z`)).replace(".", "")

export const formatPercent = (share: number) => percentFormatter.format(share)

// Hoje no relógio de quem está usando, como AAAA-MM-DD
export const todayDate = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

// Mês atual no relógio de quem está usando
export const currentMonth = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

// "2026-01" - 1 = "2025-12"
export const shiftMonth = (month: string, amount: number) => {
  const [year, monthNumber] = month.split("-").map(Number)
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1))
  return date.toISOString().slice(0, 7)
}

// Primeiro e último dia do mês, pro filtro de lançamentos
export const monthBounds = (month: string) => {
  const next = shiftMonth(month, 1)
  const last = new Date(Date.UTC(Number(next.slice(0, 4)), Number(next.slice(5)) - 1, 0))
  return { from: `${month}-01`, to: last.toISOString().slice(0, 10) }
}

// "R$ 1.234,56" / "1234,56" / "-45.90" -> centavos (ou null se não der pra entender)
export const parseMoneyInput = (value: string): number | null => {
  let text = value.replace(/r\$/i, "").replace(/\s/g, "")
  if (!text) return null
  if (text.includes(",")) text = text.replace(/\./g, "").replace(",", ".")
  if (!/^-?\d+(\.\d{1,2})?$/.test(text)) return null
  return Math.round(Number(text) * 100)
}
