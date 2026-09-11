/**
 * DeleteRuleService.ts - Apaga uma regra de categoria
 * # Pra que serve?
 * - Remover a regra (o que ela já categorizou continua categorizado)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"

export const RULE_NOT_FOUND = "Regra não encontrada"

export class DeleteRuleService {
  async execute(userId: string, ruleId: string) {
    const { count } = await prisma.categoryRule.deleteMany({ where: { id: ruleId, user_id: userId } })

    if (count === 0) throw new Error(RULE_NOT_FOUND)
  }
}
