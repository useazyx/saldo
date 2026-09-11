/**
 * SpendingByCategoryController.ts - Devolve os totais do mês por categoria
 * # Pra que serve?
 * - Passar mês e tipo (saídas ou entradas) pro service e responder as fatias
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { ByCategoryQuery } from "../../schemas/reportSchemas.js"
import { SpendingByCategoryService } from "../../services/reports/SpendingByCategoryService.js"

export class SpendingByCategoryController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { month, kind } = req.query as ByCategoryQuery

    try {
      const spendingByCategoryService = new SpendingByCategoryService()
      const slices = await spendingByCategoryService.execute(req.user.sub, month, kind)

      return rep.status(200).send(slices)
    } catch (error) {
      return sendUnexpectedError(rep, error, "totais por categoria")
    }
  }
}
