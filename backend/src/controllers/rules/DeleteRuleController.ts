/**
 * DeleteRuleController.ts - Recebe o pedido pra apagar uma regra
 * # Pra que serve?
 * - Apagar a regra e responder sem corpo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { IdParams } from "../../schemas/commonSchemas.js"
import { DeleteRuleService, RULE_NOT_FOUND } from "../../services/rules/DeleteRuleService.js"

export class DeleteRuleController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as IdParams

    try {
      const deleteRuleService = new DeleteRuleService()
      await deleteRuleService.execute(req.user.sub, id)

      return rep.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (message === RULE_NOT_FOUND) {
        return rep.status(404).send({ error: "RuleNotFound", message: "Não achei essa regra entre as suas" })
      }

      return sendUnexpectedError(rep, error, "apagar regra")
    }
  }
}
