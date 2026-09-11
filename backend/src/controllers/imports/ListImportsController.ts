/**
 * ListImportsController.ts - Devolve o histórico de importações
 * # Pra que serve?
 * - Listar os extratos que a pessoa já importou, com o placar de cada um
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import type { FastifyReply, FastifyRequest } from "fastify"
import { sendUnexpectedError } from "../../errors/sendUnexpectedError.js"
import { ListImportsService } from "../../services/imports/ListImportsService.js"

export class ListImportsController {
  async handle(req: FastifyRequest, rep: FastifyReply) {
    try {
      const listImportsService = new ListImportsService()
      const imports = await listImportsService.execute(req.user.sub)

      return rep.status(200).send(imports)
    } catch (error) {
      return sendUnexpectedError(rep, error, "histórico de importações")
    }
  }
}
