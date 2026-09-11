/**
 * ListTransactionsService.ts - O extrato da pessoa, com filtro, busca e paginação
 * # Pra que serve?
 * - Filtrar por conta, categoria (ou sem categoria), tipo, período e texto da descrição
 * - Somar entradas e saídas de TUDO que caiu no filtro (não só da página)
 * - Dividir em páginas, mais recente primeiro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { Prisma } from "@prisma/client"
import { prisma } from "../../config/prisma.js"
import { presentTransaction, toDateColumn, TRANSACTION_SELECT } from "./transactionPresenter.js"

export const INVALID_DATE_RANGE = "Período com início depois do fim"

// O que a gente precisa pra fazer a busca:
interface ListTransactionsRequest {
  user_id: string
  account_id?: string
  category_id?: string
  kind?: "income" | "expense"
  from?: string
  to?: string
  search?: string
  page: number
  page_size: number
}

export class ListTransactionsService {
  async execute(params: ListTransactionsRequest) {
    if (params.from && params.to && params.from > params.to) throw new Error(INVALID_DATE_RANGE)

    const where = this.buildWhereClause(params)

    // Busca em paralelo: a página, o total e as somas de entrada e saída
    const [transactions, total, income, expense] = await Promise.all([
      this.fetchPage(where, params.page, params.page_size),
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({ where: { AND: [where, { amount_cents: { gt: 0 } }] }, _sum: { amount_cents: true } }),
      prisma.transaction.aggregate({ where: { AND: [where, { amount_cents: { lt: 0 } }] }, _sum: { amount_cents: true } }),
    ])

    const incomeCents = income._sum.amount_cents ?? 0
    const expenseCents = expense._sum.amount_cents ?? 0

    return {
      transactions: transactions.map(presentTransaction),
      total,
      current_page: params.page,
      total_pages: Math.ceil(total / params.page_size),
      totals: { income_cents: incomeCents, expense_cents: expenseCents, net_cents: incomeCents + expenseCents },
    }
  }

  // Monta o filtro: dono sempre, o resto só se veio
  private buildWhereClause(params: ListTransactionsRequest): Prisma.TransactionWhereInput {
    return {
      user_id: params.user_id,
      ...(params.account_id && { account_id: params.account_id }),
      ...(params.category_id && { category_id: params.category_id === "none" ? null : params.category_id }),
      ...(params.kind === "income" && { amount_cents: { gt: 0 } }),
      ...(params.kind === "expense" && { amount_cents: { lt: 0 } }),
      ...((params.from || params.to) && {
        occurred_on: {
          ...(params.from && { gte: toDateColumn(params.from) }),
          ...(params.to && { lte: toDateColumn(params.to) }),
        },
      }),
      ...(params.search && { description: { contains: params.search, mode: "insensitive" } }),
    }
  }

  private async fetchPage(where: Prisma.TransactionWhereInput, page: number, pageSize: number) {
    return prisma.transaction.findMany({
      where,
      select: TRANSACTION_SELECT,
      // Mais recente primeiro; no mesmo dia, o que foi criado por último vem antes
      orderBy: [{ occurred_on: "desc" }, { created_at: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  }
}
