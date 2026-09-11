/**
 * CreateAccountController.ts - Recebe o cadastro de uma conta
 * # Pra que serve?
 * - Criar a conta pro usuário do token e avisar quando o nome já existe
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { AccountBody } from "../../schemas/accountSchemas.js"
import { ACCOUNT_NAME_TAKEN, CreateAccountService } from "../../services/accounts/CreateAccountService.js"

export class CreateAccountController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { name } = req.body as AccountBody

    try {
      const createAccountService = new CreateAccountService()
      const account = await createAccountService.execute(req.user.sub, name)

      return rep.status(201).send(account)
    } catch (error) {
      return this.handleServiceError(error, rep)
    }
  }

  private handleServiceError(error: unknown, rep: FastifyReply) {
    const errorMappings = [
      {
        message: ACCOUNT_NAME_TAKEN,
        handler: () =>
          rep.status(409).send({ error: "AccountNameTaken", message: "Você já tem uma conta com esse nome" }),
      },
    ]

    const message = error instanceof Error ? error.message : ""
    const mapping = errorMappings.find((item) => item.message === message)
    if (mapping) return mapping.handler()

    return sendUnexpectedError(rep, error, "cadastro de conta")
  }
}
