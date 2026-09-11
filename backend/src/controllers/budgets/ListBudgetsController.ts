/**
 * ListBudgetsController.ts - Devolve os orçamentos do mês
 * # Pra que serve?
 * - Passar o mês da query pro service e responder cada orçamento com o gasto
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { BudgetQuery } from "../../schemas/budgetSchemas.js"
import { ListBudgetsService } from "../../services/budgets/ListBudgetsService.js"

export class ListBudgetsController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { month } = req.query as BudgetQuery

    try {
      const listBudgetsService = new ListBudgetsService()
      const budgets = await listBudgetsService.execute(req.user.sub, month)

      return rep.status(200).send(budgets)
    } catch (error) {
      return sendUnexpectedError(rep, error, "listagem de orçamentos")
    }
  }
}
