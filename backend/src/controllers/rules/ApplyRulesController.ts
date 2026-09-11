/**
 * ApplyRulesController.ts - Roda as regras no que está sem categoria
 * # Pra que serve?
 * - Aplicar todas as regras de uma vez e dizer quantos lançamentos ganharam categoria
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import { ApplyRulesService } from "../../services/rules/ApplyRulesService.js"

export class ApplyRulesController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    try {
      const applyRulesService = new ApplyRulesService()
      const result = await applyRulesService.execute(req.user.sub)

      return rep.status(200).send(result)
    } catch (error) {
      return sendUnexpectedError(rep, error, "aplicar regras")
    }
  }
}
