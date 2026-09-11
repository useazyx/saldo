/**
 * MonthlyTrendController.ts - Devolve a evolução mês a mês
 * # Pra que serve?
 * - Passar até qual mês e quantos meses pro service e responder a série
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { TrendQuery } from "../../schemas/reportSchemas.js"
import { MonthlyTrendService } from "../../services/reports/MonthlyTrendService.js"

export class MonthlyTrendController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { until, months } = req.query as TrendQuery

    try {
      const monthlyTrendService = new MonthlyTrendService()
      const trend = await monthlyTrendService.execute(req.user.sub, until, months)

      return rep.status(200).send(trend)
    } catch (error) {
      return sendUnexpectedError(rep, error, "evolução mensal")
    }
  }
}
