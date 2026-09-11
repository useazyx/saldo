/**
 * index.ts - O mapa de rotas da API
 * # Pra que serve?
 * - Registrar todos os grupos de rota num lugar só (tipo o índice de um livro)
 * - Ter a rota de saúde, que serve pra saber se a API tá de pé
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.1.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial com o /health
 * - v1.1.0 (2026-09-11): Rotas de autenticação em /auth
 * - v1.2.0 (2026-09-11): Contas em /accounts
 * - v1.3.0 (2026-09-11): Categorias em /categories
 * - v1.4.0 (2026-09-11): Importação de extrato em /imports
 * - v1.5.0 (2026-09-11): Regras de categoria em /rules
 * - v1.6.0 (2026-09-11): Lançamentos em /transactions
 * - v1.7.0 (2026-09-11): Relatórios em /reports
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { accountRoutes } from "./accountRoutes.js"
import { authRoutes } from "./authRoutes.js"
import { categoryRoutes } from "./categoryRoutes.js"
import { importRoutes } from "./importRoutes.js"
import { reportRoutes } from "./reportRoutes.js"
import { ruleRoutes } from "./ruleRoutes.js"
import { transactionRoutes } from "./transactionRoutes.js"

const HEALTH_RESPONSE_SCHEMA = z.object({
  status: z.literal("ok"),
})

export const routes: FastifyPluginAsyncZod = async (app) => {
  // Rota de saúde: se respondeu, a API tá viva
  app.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Confere se a API está de pé",
        response: { 200: HEALTH_RESPONSE_SCHEMA },
      },
    },
    async () => ({ status: "ok" as const })
  )

  await app.register(authRoutes, { prefix: "/auth" })
  await app.register(accountRoutes, { prefix: "/accounts" })
  await app.register(categoryRoutes, { prefix: "/categories" })
  await app.register(importRoutes, { prefix: "/imports" })
  await app.register(ruleRoutes, { prefix: "/rules" })
  await app.register(transactionRoutes, { prefix: "/transactions" })
  await app.register(reportRoutes, { prefix: "/reports" })
}
