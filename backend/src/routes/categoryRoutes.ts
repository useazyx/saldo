/**
 * categoryRoutes.ts - As rotas de categorias
 * # Pra que serve?
 * - Listar, criar, alterar e apagar categoria
 * - Tudo aqui passa pelo porteiro
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { CreateCategoryController } from "../controllers/categories/CreateCategoryController.js"
import { DeleteCategoryController } from "../controllers/categories/DeleteCategoryController.js"
import { ListCategoriesController } from "../controllers/categories/ListCategoriesController.js"
import { UpdateCategoryController } from "../controllers/categories/UpdateCategoryController.js"
import {
  CATEGORY_SCHEMA,
  CREATE_CATEGORY_BODY_SCHEMA,
  UPDATE_CATEGORY_BODY_SCHEMA,
} from "../schemas/categorySchemas.js"
import { ID_PARAMS_SCHEMA } from "../schemas/commonSchemas.js"

export const categoryRoutes: FastifyPluginAsyncZod = async (app) => {
  // ---------- Rotas privadas ----------
  app.addHook("onRequest", app.authenticate)

  app.get(
    "/",
    {
      schema: {
        tags: ["Categories"],
        summary: "Lista as categorias (saídas primeiro)",
        security: [{ bearerAuth: [] }],
        response: { 200: z.array(CATEGORY_SCHEMA) },
      },
    },
    (req, rep) => new ListCategoriesController().handle(req, rep)
  )

  app.post(
    "/",
    {
      schema: {
        tags: ["Categories"],
        summary: "Cria uma categoria",
        security: [{ bearerAuth: [] }],
        body: CREATE_CATEGORY_BODY_SCHEMA,
        response: { 201: CATEGORY_SCHEMA },
      },
    },
    (req, rep) => new CreateCategoryController().handle(req, rep)
  )

  app.patch(
    "/:id",
    {
      schema: {
        tags: ["Categories"],
        summary: "Muda nome ou cor de uma categoria",
        security: [{ bearerAuth: [] }],
        params: ID_PARAMS_SCHEMA,
        body: UPDATE_CATEGORY_BODY_SCHEMA,
        response: { 200: CATEGORY_SCHEMA },
      },
    },
    (req, rep) => new UpdateCategoryController().handle(req, rep)
  )

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Categories"],
        summary: "Apaga uma categoria (os lançamentos ficam sem categoria)",
        security: [{ bearerAuth: [] }],
        params: ID_PARAMS_SCHEMA,
      },
    },
    (req, rep) => new DeleteCategoryController().handle(req, rep)
  )
}
