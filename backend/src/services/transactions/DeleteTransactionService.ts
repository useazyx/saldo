/**
 * DeleteTransactionService.ts - Apaga um lançamento
 * # Pra que serve?
 * - Remover um lançamento da própria pessoa
 * - Se era de um CSV, importar o arquivo de novo traz ele de volta (a digital não fica guardada)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { TRANSACTION_NOT_FOUND } from "./UpdateTransactionService.js"

export class DeleteTransactionService {
  async execute(userId: string, transactionId: string) {
    const { count } = await prisma.transaction.deleteMany({ where: { id: transactionId, user_id: userId } })

    if (count === 0) throw new Error(TRANSACTION_NOT_FOUND)
  }
}
