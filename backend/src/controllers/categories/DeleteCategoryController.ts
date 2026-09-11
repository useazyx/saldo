/**
 * DeleteCategoryController.ts - Recebe o pedido pra apagar uma categoria
 * # Pra que serve?
 * - Apagar a categoria (os lançamentos ficam sem categoria) e responder sem corpo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { IdParams } from "../../schemas/commonSchemas.js"
import { DeleteCategoryService } from "../../services/categories/DeleteCategoryService.js"
import { CATEGORY_NOT_FOUND } from "../../services/categories/UpdateCategoryService.js"

export class DeleteCategoryController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as IdParams

    try {
      const deleteCategoryService = new DeleteCategoryService()
      await deleteCategoryService.execute(req.user.sub, id)

      return rep.status(204).send()
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
    ]

    const message = error instanceof Error ? error.message : ""
    const mapping = errorMappings.find((item) => item.message === message)
    if (mapping) return mapping.handler()

    return sendUnexpectedError(rep, error, "apagar categoria")
  }
}
