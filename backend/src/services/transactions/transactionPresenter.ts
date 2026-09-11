/**
 * transactionPresenter.ts - Como um lançamento sai da API
 * # Pra que serve?
 * - Buscar o lançamento já com a conta e a categoria
 * - Devolver a data como AAAA-MM-DD (é data de calendário, não tem hora nem fuso)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { Prisma } from "@prisma/client"
import type { CategoryColor } from "../../config/defaultCategories.js"

export const TRANSACTION_SELECT = {
  id: true,
  occurred_on: true,
  description: true,
  amount_cents: true,
  notes: true,
  account: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, color: true, kind: true } },
} satisfies Prisma.TransactionSelect

export type TransactionRecord = Prisma.TransactionGetPayload<{ select: typeof TRANSACTION_SELECT }>

export function presentTransaction(transaction: TransactionRecord) {
  return {
    ...transaction,
    occurred_on: transaction.occurred_on.toISOString().slice(0, 10),
    category: transaction.category
      ? { ...transaction.category, color: transaction.category.color as CategoryColor }
      : null,
  }
}

// "2026-08-31" -> Date à meia-noite UTC, que é como o Prisma grava coluna @db.Date
export const toDateColumn = (date: string): Date => new Date(`${date}T00:00:00.000Z`)
