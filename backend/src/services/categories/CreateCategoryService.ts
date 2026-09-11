/**
 * CreateCategoryService.ts - Cria uma categoria nova
 * # Pra que serve?
 * - Salvar nome, tipo (entrada ou saída) e cor
 * - Não deixar duas categorias com o mesmo nome pra mesma pessoa
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { Prisma, type CategoryKind } from "@prisma/client"
import type { CategoryColor } from "../../config/defaultCategories.js"
import { prisma } from "../../config/prisma.js"

export const CATEGORY_NAME_TAKEN = "Já existe uma categoria com esse nome"

// O que a gente precisa pra criar:
interface CreateCategoryRequest {
  user_id: string
  name: string
  kind: CategoryKind
  color: CategoryColor
}

export class CreateCategoryService {
  async execute(data: CreateCategoryRequest) {
    try {
      const category = await prisma.category.create({
        data,
        select: { id: true, name: true, kind: true, color: true },
      })

      return { ...category, color: category.color as CategoryColor, transactions_count: 0 }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(CATEGORY_NAME_TAKEN)
      }
      throw error
    }
  }
}
