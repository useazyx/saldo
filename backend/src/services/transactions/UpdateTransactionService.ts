/**
 * UpdateTransactionService.ts - Ajusta um lançamento
 * # Pra que serve?
 * - Trocar a categoria (ou tirar), mexer na descrição e nas anotações
 * - Data, valor e conta não mudam: eles vieram do banco e são a digital do lançamento
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { ensureCategoryOwnership } from "./ownershipChecks.js"
import { presentTransaction, TRANSACTION_SELECT } from "./transactionPresenter.js"

export const TRANSACTION_NOT_FOUND = "Lançamento não encontrado"

// O que a gente precisa pra alterar:
interface UpdateTransactionRequest {
  user_id: string
  transaction_id: string
  changes: { description?: string; category_id?: string | null; notes?: string | null }
}

export class UpdateTransactionService {
  async execute({ user_id, transaction_id, changes }: UpdateTransactionRequest) {
    if (changes.category_id) await ensureCategoryOwnership(changes.category_id, user_id)

    const { count } = await prisma.transaction.updateMany({
      where: { id: transaction_id, user_id },
      data: changes,
    })
    if (count === 0) throw new Error(TRANSACTION_NOT_FOUND)

    const transaction = await prisma.transaction.findUniqueOrThrow({
      where: { id: transaction_id },
      select: TRANSACTION_SELECT,
    })
    return presentTransaction(transaction)
  }
}
