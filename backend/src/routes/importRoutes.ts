/**
 * importRoutes.ts - As rotas de importação de extrato
 * # Pra que serve?
 * - Prévia (não salva nada), importação de verdade e histórico
 * - O CSV vai no campo "file" do multipart; a conta vai na query (?account_id=)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { ConfirmImportController } from "../controllers/imports/ConfirmImportController.js"
import { ListImportsController } from "../controllers/imports/ListImportsController.js"
import { PreviewImportController } from "../controllers/imports/PreviewImportController.js"
import {
  IMPORT_HISTORY_ITEM_SCHEMA,
  IMPORT_PREVIEW_SCHEMA,
  IMPORT_QUERY_SCHEMA,
  IMPORT_RESULT_SCHEMA,
} from "../schemas/importSchemas.js"

export const importRoutes: FastifyPluginAsyncZod = async (app) => {
  // ---------- Rotas privadas ----------
  app.addHook("onRequest", app.authenticate)

  app.post(
    "/preview",
    {
      schema: {
        tags: ["Imports"],
        summary: "Mostra o que o extrato vai gerar, sem salvar nada",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        querystring: IMPORT_QUERY_SCHEMA,
        response: { 200: IMPORT_PREVIEW_SCHEMA },
      },
    },
    (req, rep) => new PreviewImportController().handle(req, rep)
  )

  app.post(
    "/",
    {
      schema: {
        tags: ["Imports"],
        summary: "Importa o extrato (só os lançamentos novos entram)",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        querystring: IMPORT_QUERY_SCHEMA,
        response: { 201: IMPORT_RESULT_SCHEMA },
      },
    },
    (req, rep) => new ConfirmImportController().handle(req, rep)
  )

  app.get(
    "/",
    {
      schema: {
        tags: ["Imports"],
        summary: "Histórico de importações",
        security: [{ bearerAuth: [] }],
        response: { 200: z.array(IMPORT_HISTORY_ITEM_SCHEMA) },
      },
    },
    (req, rep) => new ListImportsController().handle(req, rep)
  )
}
