/**
 * transactionRoutes.ts - As rotas de lançamentos
 * # Pra que serve?
 * - Listar com filtros, lançar na mão, ajustar e apagar
 * - Tudo aqui passa pelo porteiro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { CreateTransactionController } from "../controllers/transactions/CreateTransactionController.js"
import { DeleteTransactionController } from "../controllers/transactions/DeleteTransactionController.js"
import { ListTransactionsController } from "../controllers/transactions/ListTransactionsController.js"
import { UpdateTransactionController } from "../controllers/transactions/UpdateTransactionController.js"
import { ID_PARAMS_SCHEMA } from "../schemas/commonSchemas.js"
import {
  CREATE_TRANSACTION_BODY_SCHEMA,
  LIST_TRANSACTIONS_QUERY_SCHEMA,
  TRANSACTION_LIST_RESPONSE_SCHEMA,
  TRANSACTION_SCHEMA,
  UPDATE_TRANSACTION_BODY_SCHEMA,
} from "../schemas/transactionSchemas.js"

export const transactionRoutes: FastifyPluginAsyncZod = async (app) => {
  // ---------- Rotas privadas ----------
  app.addHook("onRequest", app.authenticate)

  app.get(
    "/",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Lista lançamentos com filtros, busca, paginação e totais",
        security: [{ bearerAuth: [] }],
        querystring: LIST_TRANSACTIONS_QUERY_SCHEMA,
        response: { 200: TRANSACTION_LIST_RESPONSE_SCHEMA },
      },
    },
    (req, rep) => new ListTransactionsController().handle(req, rep)
  )

  app.post(
    "/",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Lança um gasto ou entrada na mão",
        security: [{ bearerAuth: [] }],
        body: CREATE_TRANSACTION_BODY_SCHEMA,
        response: { 201: TRANSACTION_SCHEMA },
      },
    },
    (req, rep) => new CreateTransactionController().handle(req, rep)
  )

  app.patch(
    "/:id",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Troca categoria, descrição ou anotação",
        security: [{ bearerAuth: [] }],
        params: ID_PARAMS_SCHEMA,
        body: UPDATE_TRANSACTION_BODY_SCHEMA,
        response: { 200: TRANSACTION_SCHEMA },
      },
    },
    (req, rep) => new UpdateTransactionController().handle(req, rep)
  )

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Transactions"],
        summary: "Apaga um lançamento",
        security: [{ bearerAuth: [] }],
        params: ID_PARAMS_SCHEMA,
      },
    },
    (req, rep) => new DeleteTransactionController().handle(req, rep)
  )
}
