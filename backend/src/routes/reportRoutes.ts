/**
 * reportRoutes.ts - As rotas dos relatórios que alimentam o painel
 * # Pra que serve?
 * - Resumo do mês, totais por categoria e evolução mês a mês
 * - Tudo aqui passa pelo porteiro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { MonthlyTrendController } from "../controllers/reports/MonthlyTrendController.js"
import { MonthSummaryController } from "../controllers/reports/MonthSummaryController.js"
import { SpendingByCategoryController } from "../controllers/reports/SpendingByCategoryController.js"
import {
  BY_CATEGORY_QUERY_SCHEMA,
  CATEGORY_SPENDING_SCHEMA,
  MONTH_QUERY_SCHEMA,
  MONTH_SUMMARY_SCHEMA,
  MONTHLY_TREND_SCHEMA,
  TREND_QUERY_SCHEMA,
} from "../schemas/reportSchemas.js"

export const reportRoutes: FastifyPluginAsyncZod = async (app) => {
  // ---------- Rotas privadas ----------
  app.addHook("onRequest", app.authenticate)

  app.get(
    "/summary",
    {
      schema: {
        tags: ["Reports"],
        summary: "Entradas, saídas e saldo do mês, comparados com o mês anterior",
        security: [{ bearerAuth: [] }],
        querystring: MONTH_QUERY_SCHEMA,
        response: { 200: MONTH_SUMMARY_SCHEMA },
      },
    },
    (req, rep) => new MonthSummaryController().handle(req, rep)
  )

  app.get(
    "/by-category",
    {
      schema: {
        tags: ["Reports"],
        summary: "Totais do mês por categoria (saídas ou entradas)",
        security: [{ bearerAuth: [] }],
        querystring: BY_CATEGORY_QUERY_SCHEMA,
        response: { 200: CATEGORY_SPENDING_SCHEMA },
      },
    },
    (req, rep) => new SpendingByCategoryController().handle(req, rep)
  )

  app.get(
    "/monthly",
    {
      schema: {
        tags: ["Reports"],
        summary: "Evolução mês a mês",
        security: [{ bearerAuth: [] }],
        querystring: TREND_QUERY_SCHEMA,
        response: { 200: MONTHLY_TREND_SCHEMA },
      },
    },
    (req, rep) => new MonthlyTrendController().handle(req, rep)
  )
}
