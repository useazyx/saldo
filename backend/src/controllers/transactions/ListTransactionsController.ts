/**
 * ListTransactionsController.ts - Devolve o extrato filtrado
 * # Pra que serve?
 * - Passar os filtros da query pro service e responder a página com os totais
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { ListTransactionsQuery } from "../../schemas/transactionSchemas.js"
import {
  INVALID_DATE_RANGE,
  ListTransactionsService,
} from "../../services/transactions/ListTransactionsService.js"

export class ListTransactionsController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const query = req.query as ListTransactionsQuery

    try {
      const listTransactionsService = new ListTransactionsService()
      const result = await listTransactionsService.execute({ ...query, user_id: req.user.sub })

      return rep.status(200).send(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (message === INVALID_DATE_RANGE) {
        return rep.status(400).send({ error: "InvalidDateRange", message: "O 'from' precisa ser antes (ou igual) ao 'to'" })
      }

      return sendUnexpectedError(rep, error, "listagem de lançamentos")
    }
  }
}
