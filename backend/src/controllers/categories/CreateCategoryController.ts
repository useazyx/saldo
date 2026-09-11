/**
 * CreateCategoryController.ts - Recebe a criação de uma categoria
 * # Pra que serve?
 * - Criar a categoria pro usuário do token e avisar quando o nome já existe
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { CreateCategoryBody } from "../../schemas/categorySchemas.js"
import { CATEGORY_NAME_TAKEN, CreateCategoryService } from "../../services/categories/CreateCategoryService.js"

export class CreateCategoryController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const body = req.body as CreateCategoryBody

    try {
      const createCategoryService = new CreateCategoryService()
      const category = await createCategoryService.execute({ ...body, user_id: req.user.sub })

      return rep.status(201).send(category)
    } catch (error) {
      return this.handleServiceError(error, rep)
    }
  }

  private handleServiceError(error: unknown, rep: FastifyReply) {
    const errorMappings = [
      {
        message: CATEGORY_NAME_TAKEN,
        handler: () =>
          rep.status(409).send({ error: "CategoryNameTaken", message: "Você já tem uma categoria com esse nome" }),
      },
    ]

    const message = error instanceof Error ? error.message : ""
    const mapping = errorMappings.find((item) => item.message === message)
    if (mapping) return mapping.handler()

    return sendUnexpectedError(rep, error, "criação de categoria")
  }
}
