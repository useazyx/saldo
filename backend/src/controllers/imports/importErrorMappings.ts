/**
 * importErrorMappings.ts - As respostas de erro que a prévia e a importação têm em comum
 * # Pra que serve?
 * - Traduzir conta inexistente, arquivo sem formato conhecido, vazio ou grande demais
 * - Ficar num lugar só, porque os dois controllers respondem exatamente igual
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply } from "fastify"
import { MAX_IMPORT_BYTES } from "../../schemas/importSchemas.js"
import { ACCOUNT_NOT_FOUND } from "../../services/accounts/RenameAccountService.js"
import { MAX_IMPORT_ROWS, TOO_MANY_ROWS } from "../../services/imports/AnalyzeStatementService.js"
import { EMPTY_STATEMENT, MISSING_COLUMNS } from "../../utils/statementCsv.js"

export const MISSING_FILE = "Nenhum arquivo enviado"

// Devolve a resposta se o erro for conhecido; null se não for (aí o controller trata como inesperado)
export function sendImportError(error: unknown, rep: FastifyReply) {
  // O plugin de upload avisa arquivo grande com statusCode 413
  if (error instanceof Error && "statusCode" in error && error.statusCode === 413) {
    return rep.status(413).send({
      error: "FileTooLarge",
      message: `O arquivo passa de ${MAX_IMPORT_BYTES / 1024 / 1024} MB`,
    })
  }

  const errorMappings = [
    {
      message: MISSING_FILE,
      handler: () => rep.status(400).send({ error: "MissingFile", message: "Manda o CSV do extrato no campo file" }),
    },
    {
      message: ACCOUNT_NOT_FOUND,
      handler: () => rep.status(404).send({ error: "AccountNotFound", message: "Não achei essa conta entre as suas" }),
    },
    {
      message: MISSING_COLUMNS,
      handler: () =>
        rep.status(422).send({
          error: "UnrecognizedStatement",
          message: "Não achei as colunas de data, descrição e valor. Confere se é o CSV do extrato",
        }),
    },
    {
      message: EMPTY_STATEMENT,
      handler: () => rep.status(422).send({ error: "EmptyStatement", message: "O arquivo não tem nenhum lançamento" }),
    },
    {
      message: TOO_MANY_ROWS,
      handler: () =>
        rep.status(422).send({
          error: "TooManyRows",
          message: `Importa no máximo ${MAX_IMPORT_ROWS} lançamentos por vez. Divide o arquivo por período`,
        }),
    },
  ]

  const message = error instanceof Error ? error.message : ""
  const mapping = errorMappings.find((item) => item.message === message)
  return mapping ? mapping.handler() : null
}
