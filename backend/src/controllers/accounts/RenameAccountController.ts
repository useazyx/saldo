/**
 * RenameAccountController.ts - Recebe o nome novo de uma conta
 * # Pra que serve?
 * - Renomear a conta e traduzir conta inexistente e nome repetido
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { AccountBody } from "../../schemas/accountSchemas.js"
import type { IdParams } from "../../schemas/commonSchemas.js"
import { ACCOUNT_NAME_TAKEN } from "../../services/accounts/CreateAccountService.js"
import { ACCOUNT_NOT_FOUND, RenameAccountService } from "../../services/accounts/RenameAccountService.js"

export class RenameAccountController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as IdParams
    const { name } = req.body as AccountBody

    try {
      const renameAccountService = new RenameAccountService()
      const account = await renameAccountService.execute(req.user.sub, id, name)

      return rep.status(200).send(account)
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
      {
        message: ACCOUNT_NAME_TAKEN,
        handler: () =>
          rep.status(409).send({ error: "AccountNameTaken", message: "Você já tem uma conta com esse nome" }),
      },
    ]

    const message = error instanceof Error ? error.message : ""
    const mapping = errorMappings.find((item) => item.message === message)
    if (mapping) return mapping.handler()

    return sendUnexpectedError(rep, error, "renomear conta")
  }
}
