/**
 * ListAccountsService.ts - Lista as contas com o saldo de cada uma
 * # Pra que serve?
 * - Mostrar todas as contas da pessoa
 * - Somar os lançamentos de cada conta no banco (e não trazendo tudo pra somar aqui)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"

export class ListAccountsService {
  async execute(userId: string) {
    // Busca em paralelo: as contas e os totais agrupados por conta
    const [accounts, totals] = await Promise.all([
      prisma.account.findMany({
        where: { user_id: userId },
        select: { id: true, name: true, created_at: true },
        orderBy: { name: "asc" },
      }),
      prisma.transaction.groupBy({
        by: ["account_id"],
        where: { user_id: userId },
        _sum: { amount_cents: true },
        _count: { _all: true },
      }),
    ])

    const totalsByAccount = new Map(totals.map((total) => [total.account_id, total]))

    return accounts.map((account) => {
      const total = totalsByAccount.get(account.id)
      return {
        ...account,
        created_at: account.created_at.toISOString(),
        balance_cents: total?._sum.amount_cents ?? 0,
        transactions_count: total?._count._all ?? 0,
      }
    })
  }
}
