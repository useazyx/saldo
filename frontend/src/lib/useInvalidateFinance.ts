import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

// Mexeu em lançamento, categoria ou conta: tudo que soma dinheiro precisa recarregar
export function useInvalidateFinance() {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    await Promise.all(
      ["transactions", "reports", "budgets", "accounts", "categories", "imports"].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    )
  }, [queryClient])
}
