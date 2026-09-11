/**
 * DeleteAccountController.ts - Recebe o pedido pra apagar uma conta
 * # Pra que serve?
 * - Apagar a conta (com os lançamentos dela) e responder sem corpo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { IdParams } from "../../schemas/commonSchemas.js"
import { DeleteAccountService } from "../../services/accounts/DeleteAccountService.js"
import { ACCOUNT_NOT_FOUND } from "../../services/accounts/RenameAccountService.js"

export class DeleteAccountController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as IdParams

    try {
      const deleteAccountService = new DeleteAccountService()
      await deleteAccountService.execute(req.user.sub, id)

      return rep.status(204).send()
    } catch (error) {
      return this.handleServiceError(error, rep)
    }
  }

  private handleServiceError(error: unknown, rep: FastifyReply) {
    const errorMappings = [
      {
        message: ACCOUNT_NOT_FOUND,
        handler: () => rep.status(404).send({ error: "AccountNotFound", message: "Não achei essa conta entre as suas" }),
      },
    ]

    const message = error instanceof Error ? error.message : ""
    const mapping = errorMappings.find((item) => item.message === message)
    if (mapping) return mapping.handler()

    return sendUnexpectedError(rep, error, "apagar conta")
  }
}
