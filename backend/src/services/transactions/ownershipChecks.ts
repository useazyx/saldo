/**
 * ownershipChecks.ts - Confere se conta e categoria são da pessoa
 * # Pra que serve?
 * - Evitar lançar em conta de outra pessoa ou usar categoria de outra pessoa
 * - Ficar num lugar só, porque criar e editar lançamento fazem as mesmas checagens
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { ACCOUNT_NOT_FOUND } from "../accounts/RenameAccountService.js"
import { CATEGORY_NOT_FOUND } from "../categories/UpdateCategoryService.js"

export async function ensureAccountOwnership(accountId: string, userId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, user_id: userId }, select: { id: true } })
  if (!account) throw new Error(ACCOUNT_NOT_FOUND)
}

export async function ensureCategoryOwnership(categoryId: string, userId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, user_id: userId }, select: { id: true } })
  if (!category) throw new Error(CATEGORY_NOT_FOUND)
}
