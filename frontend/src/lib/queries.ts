import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../auth/AuthContext"
import type {
  Account,
  Budget,
  Category,
  CategorySlice,
  ImportHistoryItem,
  MonthSummary,
  MonthTotals,
  Rule,
  TransactionList,
} from "./types"

// Chaves do cache num lugar só: quem altera dado invalida pela raiz (ex.: tudo que começa com "reports")
export const queryKeys = {
  summary: (month: string) => ["reports", "summary", month] as const,
  slices: (month: string, kind: "income" | "expense") => ["reports", "by-category", month, kind] as const,
  trend: (until: string, months: number) => ["reports", "monthly", until, months] as const,
  budgets: (month: string) => ["budgets", month] as const,
  accounts: ["accounts"] as const,
  categories: ["categories"] as const,
  rules: ["rules"] as const,
  imports: ["imports"] as const,
  transactions: (filters: TransactionFilters) => ["transactions", filters] as const,
}

export interface TransactionFilters {
  account_id?: string
  category_id?: string
  kind?: "income" | "expense"
  from?: string
  to?: string
  search?: string
  page?: number
  page_size?: number
}

// Ao trocar de mês, os dados do mês anterior ficam na tela até os novos chegarem (sem piscar)
const keepPrevious = <T,>(previous: T | undefined) => previous

export function useMonthSummary(month: string) {
  const { request } = useAuth()
  return useQuery({
    queryKey: queryKeys.summary(month),
    queryFn: () => request<MonthSummary>("/reports/summary", { query: { month } }),
    placeholderData: keepPrevious,
  })
}

export function useCategorySlices(month: string, kind: "income" | "expense" = "expense") {
  const { request } = useAuth()
  return useQuery({
    queryKey: queryKeys.slices(month, kind),
    queryFn: () => request<CategorySlice[]>("/reports/by-category", { query: { month, kind } }),
    placeholderData: keepPrevious,
  })
}

export function useMonthlyTrend(until: string, months = 6) {
  const { request } = useAuth()
  return useQuery({
    queryKey: queryKeys.trend(until, months),
    queryFn: () => request<MonthTotals[]>("/reports/monthly", { query: { until, months } }),
    placeholderData: keepPrevious,
  })
}

export function useBudgets(month: string) {
  const { request } = useAuth()
  return useQuery({
    queryKey: queryKeys.budgets(month),
    queryFn: () => request<Budget[]>("/budgets", { query: { month } }),
    placeholderData: keepPrevious,
  })
}

export function useAccounts() {
  const { request } = useAuth()
  return useQuery({ queryKey: queryKeys.accounts, queryFn: () => request<Account[]>("/accounts") })
}

export function useCategories() {
  const { request } = useAuth()
  return useQuery({ queryKey: queryKeys.categories, queryFn: () => request<Category[]>("/categories") })
}

export function useRules() {
  const { request } = useAuth()
  return useQuery({ queryKey: queryKeys.rules, queryFn: () => request<Rule[]>("/rules") })
}

export function useImportHistory() {
  const { request } = useAuth()
  return useQuery({ queryKey: queryKeys.imports, queryFn: () => request<ImportHistoryItem[]>("/imports") })
}

export function useTransactions(filters: TransactionFilters) {
  const { request } = useAuth()
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () => request<TransactionList>("/transactions", { query: { ...filters } }),
    // Ao trocar de página ou filtro, mantém a lista anterior na tela até a nova chegar
    placeholderData: (previous) => previous,
  })
}
