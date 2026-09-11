/**
 * CreateTransactionController.ts - Recebe um lançamento manual
 * # Pra que serve?
 * - Mandar o lançamento pro service e responder com ele já categorizado
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { CreateTransactionBody } from "../../schemas/transactionSchemas.js"
import { CreateTransactionService } from "../../services/transactions/CreateTransactionService.js"
import { sendTransactionError } from "./transactionErrorMappings.js"

export class CreateTransactionController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const body = req.body as CreateTransactionBody

    try {
      const createTransactionService = new CreateTransactionService()
      const transaction = await createTransactionService.execute({ ...body, user_id: req.user.sub })

      return rep.status(201).send(transaction)
    } catch (error) {
      return sendTransactionError(error, rep) ?? sendUnexpectedError(rep, error, "lançamento manual")
    }
  }
}
