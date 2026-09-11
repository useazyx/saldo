/**
 * DeleteTransactionController.ts - Recebe o pedido pra apagar um lançamento
 * # Pra que serve?
 * - Apagar o lançamento e responder sem corpo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { IdParams } from "../../schemas/commonSchemas.js"
import { DeleteTransactionService } from "../../services/transactions/DeleteTransactionService.js"
import { sendTransactionError } from "./transactionErrorMappings.js"

export class DeleteTransactionController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as IdParams

    try {
      const deleteTransactionService = new DeleteTransactionService()
      await deleteTransactionService.execute(req.user.sub, id)

      return rep.status(204).send()
    } catch (error) {
      return sendTransactionError(error, rep) ?? sendUnexpectedError(rep, error, "apagar lançamento")
    }
  }
}
