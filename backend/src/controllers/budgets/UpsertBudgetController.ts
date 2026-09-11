/**
 * UpsertBudgetController.ts - Recebe o limite de uma categoria no mês
 * # Pra que serve?
 * - Criar ou trocar o orçamento e traduzir categoria inválida
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { UpsertBudgetBody } from "../../schemas/budgetSchemas.js"
import {
  BUDGET_NEEDS_EXPENSE_CATEGORY,
  UpsertBudgetService,
} from "../../services/budgets/UpsertBudgetService.js"
import { CATEGORY_NOT_FOUND } from "../../services/categories/UpdateCategoryService.js"

export class UpsertBudgetController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const body = req.body as UpsertBudgetBody

    try {
      const upsertBudgetService = new UpsertBudgetService()
      const budget = await upsertBudgetService.execute({ ...body, user_id: req.user.sub })

      return rep.status(200).send(budget)
    } catch (error) {
      return this.handleServiceError(error, rep)
    }
  }

  private handleServiceError(error: unknown, rep: FastifyReply) {
    const errorMappings = [
      {
        message: CATEGORY_NOT_FOUND,
        handler: () =>
          rep.status(404).send({ error: "CategoryNotFound", message: "Não achei essa categoria entre as suas" }),
      },
      {
        message: BUDGET_NEEDS_EXPENSE_CATEGORY,
        handler: () =>
          rep.status(422).send({
            error: "BudgetNeedsExpenseCategory",
            message: "Orçamento só dá pra definir em categoria de saída",
          }),
      },
    ]

    const message = error instanceof Error ? error.message : ""
    const mapping = errorMappings.find((item) => item.message === message)
    if (mapping) return mapping.handler()

    return sendUnexpectedError(rep, error, "definir orçamento")
  }
}
