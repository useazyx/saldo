/**
 * accountRoutes.ts - As rotas de contas e cartões
 * # Pra que serve?
 * - Criar, listar, renomear e apagar conta
 * - Tudo aqui passa pelo porteiro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { CreateAccountController } from "../controllers/accounts/CreateAccountController.js"
import { DeleteAccountController } from "../controllers/accounts/DeleteAccountController.js"
import { ListAccountsController } from "../controllers/accounts/ListAccountsController.js"
import { RenameAccountController } from "../controllers/accounts/RenameAccountController.js"
import { ACCOUNT_BODY_SCHEMA, ACCOUNT_SCHEMA } from "../schemas/accountSchemas.js"
import { ID_PARAMS_SCHEMA } from "../schemas/commonSchemas.js"

export const accountRoutes: FastifyPluginAsyncZod = async (app) => {
  // ---------- Rotas privadas ----------
  app.addHook("onRequest", app.authenticate)

  app.get(
    "/",
    {
      schema: {
        tags: ["Accounts"],
        summary: "Lista as contas com saldo",
        security: [{ bearerAuth: [] }],
        response: { 200: z.array(ACCOUNT_SCHEMA) },
      },
    },
    (req, rep) => new ListAccountsController().handle(req, rep)
  )

  app.post(
    "/",
    {
      schema: {
        tags: ["Accounts"],
        summary: "Cadastra uma conta ou cartão",
        security: [{ bearerAuth: [] }],
        body: ACCOUNT_BODY_SCHEMA,
        response: { 201: ACCOUNT_SCHEMA },
      },
    },
    (req, rep) => new CreateAccountController().handle(req, rep)
  )

  app.patch(
    "/:id",
    {
      schema: {
        tags: ["Accounts"],
        summary: "Renomeia uma conta",
        security: [{ bearerAuth: [] }],
        params: ID_PARAMS_SCHEMA,
        body: ACCOUNT_BODY_SCHEMA,
        response: { 200: ACCOUNT_SCHEMA },
      },
    },
    (req, rep) => new RenameAccountController().handle(req, rep)
  )

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Accounts"],
        summary: "Apaga uma conta e os lançamentos dela",
        security: [{ bearerAuth: [] }],
        params: ID_PARAMS_SCHEMA,
      },
    },
    (req, rep) => new DeleteAccountController().handle(req, rep)
  )
}
