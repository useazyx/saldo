/**
 * PreviewImportController.ts - Recebe o CSV e devolve a prévia
 * # Pra que serve?
 * - Ler o arquivo do upload (UTF-8 ou Latin-1) e mandar pro service analisar, sem salvar nada
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import type { ImportQuery } from "../../schemas/importSchemas.js"
import { PreviewImportService } from "../../services/imports/PreviewImportService.js"
import { decodeTextFile } from "../../utils/fileEncoding.js"
import { MISSING_FILE, sendImportError } from "./importErrorMappings.js"

export class PreviewImportController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    const { account_id } = req.query as ImportQuery

    try {
      const content = await this.readUploadedFile(req)

      const previewImportService = new PreviewImportService()
      const preview = await previewImportService.execute({ user_id: req.user.sub, account_id, content })

      return rep.status(200).send(preview)
    } catch (error) {
      return sendImportError(error, rep) ?? sendUnexpectedError(rep, error, "prévia de importação")
    }
  }

  private async readUploadedFile(req: FastifyRequest) {
    const file = await req.file()
    if (!file) throw new Error(MISSING_FILE)

    return decodeTextFile(await file.toBuffer())
  }
}
