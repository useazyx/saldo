/**
 * DeleteBudgetController.ts - Recebe o pedido pra tirar um orçamento
 * # Pra que serve?
 * - Apagar o orçamento e responder sem corpo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { IdParams } from "../../schemas/commonSchemas.js"
import { BUDGET_NOT_FOUND, DeleteBudgetService } from "../../services/budgets/DeleteBudgetService.js"

export class DeleteBudgetController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as IdParams

    try {
      const deleteBudgetService = new DeleteBudgetService()
      await deleteBudgetService.execute(req.user.sub, id)

      return rep.status(204).send()
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (message === BUDGET_NOT_FOUND) {
        return rep.status(404).send({ error: "BudgetNotFound", message: "Não achei esse orçamento entre os seus" })
      }

      return sendUnexpectedError(rep, error, "apagar orçamento")
    }
  }
}
