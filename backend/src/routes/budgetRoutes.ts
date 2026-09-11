/**
 * budgetRoutes.ts - As rotas de orçamento
 * # Pra que serve?
 * - Ver os orçamentos do mês, definir o limite de uma categoria e tirar um orçamento
 * - Tudo aqui passa pelo porteiro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { DeleteBudgetController } from "../controllers/budgets/DeleteBudgetController.js"
import { ListBudgetsController } from "../controllers/budgets/ListBudgetsController.js"
import { UpsertBudgetController } from "../controllers/budgets/UpsertBudgetController.js"
import { BUDGET_QUERY_SCHEMA, BUDGET_SCHEMA, UPSERT_BUDGET_BODY_SCHEMA } from "../schemas/budgetSchemas.js"
import { ID_PARAMS_SCHEMA } from "../schemas/commonSchemas.js"

export const budgetRoutes: FastifyPluginAsyncZod = async (app) => {
  // ---------- Rotas privadas ----------
  app.addHook("onRequest", app.authenticate)

  app.get(
    "/",
    {
      schema: {
        tags: ["Budgets"],
        summary: "Orçamentos do mês com gasto e situação",
        security: [{ bearerAuth: [] }],
        querystring: BUDGET_QUERY_SCHEMA,
        response: { 200: z.array(BUDGET_SCHEMA) },
      },
    },
    (req, rep) => new ListBudgetsController().handle(req, rep)
  )

  app.put(
    "/",
    {
      schema: {
        tags: ["Budgets"],
        summary: "Define (ou troca) o limite de uma categoria no mês",
        security: [{ bearerAuth: [] }],
        body: UPSERT_BUDGET_BODY_SCHEMA,
        response: { 200: BUDGET_SCHEMA },
      },
    },
    (req, rep) => new UpsertBudgetController().handle(req, rep)
  )

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Budgets"],
        summary: "Tira um orçamento",
        security: [{ bearerAuth: [] }],
        params: ID_PARAMS_SCHEMA,
      },
    },
    (req, rep) => new DeleteBudgetController().handle(req, rep)
  )
}
