/**
 * transactionErrorMappings.ts - As respostas de erro comuns dos lançamentos
 * # Pra que serve?
 * - Traduzir conta, categoria e lançamento que não existem (ou são de outra pessoa)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply } from "fastify"
import { ACCOUNT_NOT_FOUND } from "../../services/accounts/RenameAccountService.js"
import { CATEGORY_NOT_FOUND } from "../../services/categories/UpdateCategoryService.js"
import { TRANSACTION_NOT_FOUND } from "../../services/transactions/UpdateTransactionService.js"

// Devolve a resposta se o erro for conhecido; null se não for
export function sendTransactionError(error: unknown, rep: FastifyReply) {
  const errorMappings = [
    {
      message: TRANSACTION_NOT_FOUND,
      handler: () =>
        rep.status(404).send({ error: "TransactionNotFound", message: "Não achei esse lançamento entre os seus" }),
    },
    {
      message: ACCOUNT_NOT_FOUND,
      handler: () => rep.status(404).send({ error: "AccountNotFound", message: "Não achei essa conta entre as suas" }),
    },
    {
      message: CATEGORY_NOT_FOUND,
      handler: () =>
        rep.status(404).send({ error: "CategoryNotFound", message: "Não achei essa categoria entre as suas" }),
    },
  ]

  const message = error instanceof Error ? error.message : ""
  const mapping = errorMappings.find((item) => item.message === message)
  return mapping ? mapping.handler() : null
}
