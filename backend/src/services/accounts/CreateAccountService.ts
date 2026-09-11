/**
 * CreateAccountService.ts - Cadastra uma conta ou cartão
 * # Pra que serve?
 * - Criar a conta onde os extratos vão ser importados (Nubank, conta do Itaú, carteira...)
 * - Não deixar duas contas com o mesmo nome pra mesma pessoa
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../../config/prisma.js"

export const ACCOUNT_NAME_TAKEN = "Já existe uma conta com esse nome"

export class CreateAccountService {
  async execute(userId: string, name: string) {
    try {
      const account = await prisma.account.create({
        data: { user_id: userId, name },
        select: { id: true, name: true, created_at: true },
      })

      // Conta nova começa zerada
      return { ...account, created_at: account.created_at.toISOString(), balance_cents: 0, transactions_count: 0 }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(ACCOUNT_NAME_TAKEN)
      }
      throw error
    }
  }
}
