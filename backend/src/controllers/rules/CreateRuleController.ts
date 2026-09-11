/**
 * CreateRuleController.ts - Recebe uma regra nova de categoria
 * # Pra que serve?
 * - Criar a regra e, se pedirem, já aplicar no que está sem categoria
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { CreateRuleBody } from "../../schemas/ruleSchemas.js"
import { CATEGORY_NOT_FOUND } from "../../services/categories/UpdateCategoryService.js"
import { CreateRuleService, RULE_ALREADY_EXISTS } from "../../services/rules/CreateRuleService.js"

export class CreateRuleController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const body = req.body as CreateRuleBody

    try {
      const createRuleService = new CreateRuleService()
      const rule = await createRuleService.execute({ ...body, user_id: req.user.sub })

      return rep.status(201).send(rule)
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
        message: RULE_ALREADY_EXISTS,
        handler: () =>
          rep.status(409).send({ error: "RuleAlreadyExists", message: "Você já tem uma regra com esse texto" }),
      },
    ]

    const message = error instanceof Error ? error.message : ""
    const mapping = errorMappings.find((item) => item.message === message)
    if (mapping) return mapping.handler()

    return sendUnexpectedError(rep, error, "criação de regra")
  }
}
