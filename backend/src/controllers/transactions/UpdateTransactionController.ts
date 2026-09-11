/**
 * UpdateTransactionController.ts - Recebe a alteração de um lançamento
 * # Pra que serve?
 * - Mandar categoria, descrição ou anotação novas pro service
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { IdParams } from "../../schemas/commonSchemas.js"
import type { UpdateTransactionBody } from "../../schemas/transactionSchemas.js"
import { UpdateTransactionService } from "../../services/transactions/UpdateTransactionService.js"
import { sendTransactionError } from "./transactionErrorMappings.js"

export class UpdateTransactionController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as IdParams
    const changes = req.body as UpdateTransactionBody

    try {
      const updateTransactionService = new UpdateTransactionService()
      const transaction = await updateTransactionService.execute({
        user_id: req.user.sub,
        transaction_id: id,
        changes,
      })

      return rep.status(200).send(transaction)
    } catch (error) {
      return sendTransactionError(error, rep) ?? sendUnexpectedError(rep, error, "alteração de lançamento")
    }
  }
}
