/**
 * ruleRoutes.ts - As rotas de regras de categoria
 * # Pra que serve?
 * - Listar, criar e apagar regra, e aplicar todas no que está sem categoria
 * - Tudo aqui passa pelo porteiro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { ApplyRulesController } from "../controllers/rules/ApplyRulesController.js"
import { CreateRuleController } from "../controllers/rules/CreateRuleController.js"
import { DeleteRuleController } from "../controllers/rules/DeleteRuleController.js"
import { ListRulesController } from "../controllers/rules/ListRulesController.js"
import { ID_PARAMS_SCHEMA } from "../schemas/commonSchemas.js"
import {
  APPLY_RULES_RESPONSE_SCHEMA,
  CREATE_RULE_BODY_SCHEMA,
  CREATED_RULE_SCHEMA,
  RULE_SCHEMA,
} from "../schemas/ruleSchemas.js"

export const ruleRoutes: FastifyPluginAsyncZod = async (app) => {
  // ---------- Rotas privadas ----------
  app.addHook("onRequest", app.authenticate)

  app.get(
    "/",
    {
      schema: {
        tags: ["Rules"],
        summary: "Lista as regras de categoria",
        security: [{ bearerAuth: [] }],
        response: { 200: z.array(RULE_SCHEMA) },
      },
    },
    (req, rep) => new ListRulesController().handle(req, rep)
  )

  app.post(
    "/",
    {
      schema: {
        tags: ["Rules"],
        summary: "Cria uma regra (e pode aplicar no que já foi importado)",
        security: [{ bearerAuth: [] }],
        body: CREATE_RULE_BODY_SCHEMA,
        response: { 201: CREATED_RULE_SCHEMA },
      },
    },
    (req, rep) => new CreateRuleController().handle(req, rep)
  )

  app.post(
    "/apply",
    {
      schema: {
        tags: ["Rules"],
        summary: "Aplica todas as regras nos lançamentos sem categoria",
        security: [{ bearerAuth: [] }],
        response: { 200: APPLY_RULES_RESPONSE_SCHEMA },
      },
    },
    (req, rep) => new ApplyRulesController().handle(req, rep)
  )

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Rules"],
        summary: "Apaga uma regra",
        security: [{ bearerAuth: [] }],
        params: ID_PARAMS_SCHEMA,
      },
    },
    (req, rep) => new DeleteRuleController().handle(req, rep)
  )
}
