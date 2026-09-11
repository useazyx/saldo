/**
 * ListCategoriesController.ts - Devolve as categorias de quem está logado
 * # Pra que serve?
 * - Listar as categorias com a contagem de lançamentos
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import { ListCategoriesService } from "../../services/categories/ListCategoriesService.js"

export class ListCategoriesController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    try {
      const listCategoriesService = new ListCategoriesService()
      const categories = await listCategoriesService.execute(req.user.sub)

      return rep.status(200).send(categories)
    } catch (error) {
      return sendUnexpectedError(rep, error, "listagem de categorias")
    }
  }
}
