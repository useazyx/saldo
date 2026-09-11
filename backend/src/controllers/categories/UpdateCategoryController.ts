/**
 * UpdateCategoryController.ts - Recebe a alteração de uma categoria
 * # Pra que serve?
 * - Mandar nome e/ou cor novos pro service e traduzir os erros
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { UpdateCategoryBody } from "../../schemas/categorySchemas.js"
import type { IdParams } from "../../schemas/commonSchemas.js"
import { CATEGORY_NAME_TAKEN } from "../../services/categories/CreateCategoryService.js"
import { CATEGORY_NOT_FOUND, UpdateCategoryService } from "../../services/categories/UpdateCategoryService.js"

export class UpdateCategoryController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { id } = req.params as IdParams
    const changes = req.body as UpdateCategoryBody

    try {
      const updateCategoryService = new UpdateCategoryService()
      const category = await updateCategoryService.execute({ user_id: req.user.sub, category_id: id, changes })

      return rep.status(200).send(category)
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
        message: CATEGORY_NAME_TAKEN,
        handler: () =>
          rep.status(409).send({ error: "CategoryNameTaken", message: "Você já tem uma categoria com esse nome" }),
      },
    ]

    const message = error instanceof Error ? error.message : ""
    const mapping = errorMappings.find((item) => item.message === message)
    if (mapping) return mapping.handler()

    return sendUnexpectedError(rep, error, "alteração de categoria")
  }
}
