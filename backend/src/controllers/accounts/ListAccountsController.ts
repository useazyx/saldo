/**
 * ListAccountsController.ts - Devolve as contas de quem está logado
 * # Pra que serve?
 * - Listar as contas com saldo e quantidade de lançamentos
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import { ListAccountsService } from "../../services/accounts/ListAccountsService.js"

export class ListAccountsController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    try {
      const listAccountsService = new ListAccountsService()
      const accounts = await listAccountsService.execute(req.user.sub)

      return rep.status(200).send(accounts)
    } catch (error) {
      return sendUnexpectedError(rep, error, "listagem de contas")
    }
  }
}
