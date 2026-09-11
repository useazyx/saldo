// Os formatos que a API do Saldo devolve (espelham os schemas do backend)

export type CategoryColor = "blue" | "orange" | "aqua" | "yellow" | "magenta" | "green" | "violet" | "red"
export type CategoryKind = "INCOME" | "EXPENSE"

export interface User {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Account {
  id: string
  name: string
  created_at: string
  balance_cents: number
  transactions_count: number
}

export interface CategoryRef {
  id: string
  name: string
  color: CategoryColor
}

export interface Category extends CategoryRef {
  kind: CategoryKind
  transactions_count: number
}

export interface Transaction {
  id: string
  occurred_on: string
  description: string
  amount_cents: number
  notes: string | null
  account: { id: string; name: string }
  category: (CategoryRef & { kind: CategoryKind }) | null
}

export interface TransactionList {
  transactions: Transaction[]
  total: number
  current_page: number
  total_pages: number
  totals: { income_cents: number; expense_cents: number; net_cents: number }
}

export interface MonthTotals {
  month: string
  income_cents: number
  expense_cents: number
  net_cents: number
}

export interface MonthSummary extends MonthTotals {
  previous: MonthTotals
  uncategorized_count: number
}

export interface CategorySlice {
  category: CategoryRef | null
  total_cents: number
  share: number
  transactions_count: number
}

export interface Budget {
  id: string
  month: string
  category: CategoryRef
  limit_cents: number
  spent_cents: number
  remaining_cents: number
  used_share: number
  status: "ok" | "warning" | "over"
}

export interface RowError {
  line: number
  message: string
}

export interface ImportPreview {
  format: "nubank-card" | "nubank-account" | "generic"
  total_rows: number
  new_rows: number
  duplicate_rows: number
  errors: RowError[]
  rows: {
    line: number
    occurred_on: string
    description: string
    amount_cents: number
    category: CategoryRef | null
  }[]
}

export interface ImportResult {
  id: string
  file_name: string
  total_rows: number
  imported_rows: number
  duplicate_rows: number
  skipped_rows: number
  created_at: string
  errors: RowError[]
}

export interface ImportHistoryItem extends Omit<ImportResult, "errors"> {
  account: { id: string; name: string }
}

export interface Rule {
  id: string
  pattern: string
  category: CategoryRef
}

export interface ApiErrorBody {
  error: string
  message: string
  issues?: { field: string; message: string }[]
}
