/**
 * RenameAccountService.ts - Troca o nome de uma conta
 * # Pra que serve?
 * - Renomear só conta da própria pessoa (conta de outro responde igual a conta que não existe)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../../config/prisma.js"
import { ACCOUNT_NAME_TAKEN } from "./CreateAccountService.js"
import { ListAccountsService } from "./ListAccountsService.js"

export const ACCOUNT_NOT_FOUND = "Conta não encontrada"

export class RenameAccountService {
  async execute(userId: string, accountId: string, name: string) {
    await this.rename(userId, accountId, name)

    // Devolve já com saldo, igual à listagem
    const listAccountsService = new ListAccountsService()
    const accounts = await listAccountsService.execute(userId)
    return accounts.find((account) => account.id === accountId)!
  }

  private async rename(userId: string, accountId: string, name: string) {
    try {
      const { count } = await prisma.account.updateMany({ where: { id: accountId, user_id: userId }, data: { name } })
      if (count === 0) throw new Error(ACCOUNT_NOT_FOUND)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(ACCOUNT_NAME_TAKEN)
      }
      throw error
    }
  }
}
