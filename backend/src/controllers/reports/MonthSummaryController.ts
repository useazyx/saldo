/**
 * MonthSummaryController.ts - Devolve o resumo do mês
 * # Pra que serve?
 * - Passar o mês da query pro service e responder o resumo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { MonthQuery } from "../../schemas/reportSchemas.js"
import { MonthSummaryService } from "../../services/reports/MonthSummaryService.js"

export class MonthSummaryController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { month } = req.query as MonthQuery

    try {
      const monthSummaryService = new MonthSummaryService()
      const summary = await monthSummaryService.execute(req.user.sub, month)

      return rep.status(200).send(summary)
    } catch (error) {
      return sendUnexpectedError(rep, error, "resumo do mês")
    }
  }
}
