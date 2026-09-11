/**
 * DeleteCategoryService.ts - Apaga uma categoria
 * # Pra que serve?
 * - Remover a categoria sem perder dinheiro de vista: os lançamentos ficam "sem categoria"
 * - As regras e os orçamentos dela vão embora junto (não fazem sentido sozinhos)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { CATEGORY_NOT_FOUND } from "./UpdateCategoryService.js"

export class DeleteCategoryService {
  async execute(userId: string, categoryId: string) {
    const { count } = await prisma.category.deleteMany({ where: { id: categoryId, user_id: userId } })

    if (count === 0) throw new Error(CATEGORY_NOT_FOUND)
  }
}
