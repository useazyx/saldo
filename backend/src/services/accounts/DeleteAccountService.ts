/**
 * DeleteAccountService.ts - Apaga uma conta e tudo que foi importado nela
 * # Pra que serve?
 * - Remover a conta, os lançamentos e o histórico de importação dela (o banco apaga em cascata)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { ACCOUNT_NOT_FOUND } from "./RenameAccountService.js"

export class DeleteAccountService {
  async execute(userId: string, accountId: string) {
    // deleteMany com o dono no filtro: se não for dele, não apaga nada
    const { count } = await prisma.account.deleteMany({ where: { id: accountId, user_id: userId } })

    if (count === 0) throw new Error(ACCOUNT_NOT_FOUND)
  }
}
