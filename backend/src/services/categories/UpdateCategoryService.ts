/**
 * UpdateCategoryService.ts - Muda nome ou cor de uma categoria
 * # Pra que serve?
 * - Alterar só o que veio, só em categoria da própria pessoa
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { Prisma } from "@prisma/client"
import type { CategoryColor } from "../../config/defaultCategories.js"
import { prisma } from "../../config/prisma.js"
import { CATEGORY_NAME_TAKEN } from "./CreateCategoryService.js"
import { ListCategoriesService } from "./ListCategoriesService.js"

export const CATEGORY_NOT_FOUND = "Categoria não encontrada"

// O que a gente precisa pra alterar:
interface UpdateCategoryRequest {
  user_id: string
  category_id: string
  changes: { name?: string; color?: CategoryColor }
}

export class UpdateCategoryService {
  async execute({ user_id, category_id, changes }: UpdateCategoryRequest) {
    await this.update(user_id, category_id, changes)

    // Devolve já com a contagem, igual à listagem
    const listCategoriesService = new ListCategoriesService()
    const categories = await listCategoriesService.execute(user_id)
    return categories.find((category) => category.id === category_id)!
  }

  private async update(userId: string, categoryId: string, changes: UpdateCategoryRequest["changes"]) {
    try {
      const { count } = await prisma.category.updateMany({ where: { id: categoryId, user_id: userId }, data: changes })
      if (count === 0) throw new Error(CATEGORY_NOT_FOUND)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(CATEGORY_NAME_TAKEN)
      }
      throw error
    }
  }
}
