/**
 * CreateRuleService.ts - Cria uma regra de categoria
 * # Pra que serve?
 * - Conferir que a categoria é da pessoa
 * - Guardar o texto já normalizado ("  UBER " vira "uber"), sem repetir regra
 * - Se pedirem, já categorizar o que foi importado antes e ficou sem categoria
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { Prisma } from "@prisma/client"
import { prisma } from "../../config/prisma.js"
import { normalizeText } from "../../utils/text.js"
import { CATEGORY_NOT_FOUND } from "../categories/UpdateCategoryService.js"
import { ApplyRulesService } from "./ApplyRulesService.js"
import { presentRule, RULE_SELECT } from "./ruleSelect.js"

export const RULE_ALREADY_EXISTS = "Já existe uma regra com esse texto"

// O que a gente precisa pra criar:
interface CreateRuleRequest {
  user_id: string
  pattern: string
  category_id: string
  apply_to_existing: boolean
}

export class CreateRuleService {
  async execute({ user_id, pattern, category_id, apply_to_existing }: CreateRuleRequest) {
    await this.ensureCategoryBelongsToUser(category_id, user_id)

    const rule = await this.saveRule(user_id, normalizeText(pattern), category_id)

    let categorized = 0
    if (apply_to_existing) {
      const applyRulesService = new ApplyRulesService()
      categorized = (await applyRulesService.execute(user_id)).categorized
    }

    return { ...presentRule(rule), categorized }
  }

  private async ensureCategoryBelongsToUser(categoryId: string, userId: string) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, user_id: userId }, select: { id: true } })
    if (!category) throw new Error(CATEGORY_NOT_FOUND)
  }

  private async saveRule(userId: string, pattern: string, categoryId: string) {
    try {
      return await prisma.categoryRule.create({
        data: { user_id: userId, pattern, category_id: categoryId },
        select: RULE_SELECT,
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error(RULE_ALREADY_EXISTS)
      }
      throw error
    }
  }
}
