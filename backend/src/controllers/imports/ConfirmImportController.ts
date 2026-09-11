/**
 * ConfirmImportController.ts - Recebe o CSV e importa de verdade
 * # Pra que serve?
 * - Ler o arquivo do upload e mandar pro service salvar os lançamentos novos
 * - Responder com o placar da importação (entraram, repetidos, pulados)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { ImportQuery } from "../../schemas/importSchemas.js"
import { ConfirmImportService } from "../../services/imports/ConfirmImportService.js"
import { decodeTextFile } from "../../utils/fileEncoding.js"
import { MISSING_FILE, sendImportError } from "./importErrorMappings.js"

export class ConfirmImportController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { account_id } = req.query as ImportQuery

    try {
      const file = await req.file()
      if (!file) throw new Error(MISSING_FILE)

      const content = decodeTextFile(await file.toBuffer())

      const confirmImportService = new ConfirmImportService()
      const result = await confirmImportService.execute({
        user_id: req.user.sub,
        account_id,
        file_name: file.filename,
        content,
      })

      return rep.status(201).send(result)
    } catch (error) {
      return sendImportError(error, rep) ?? sendUnexpectedError(rep, error, "importação de extrato")
    }
  }
}
