/**
 * ListRulesService.ts - Lista as regras de categoria da pessoa
 * # Pra que serve?
 * - Mostrar cada regra com a categoria que ela aplica, em ordem alfabética do texto
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { prisma } from "../../config/prisma.js"
import { presentRule, RULE_SELECT } from "./ruleSelect.js"

export class ListRulesService {
  async execute(userId: string) {
    const rules = await prisma.categoryRule.findMany({
      where: { user_id: userId },
      select: RULE_SELECT,
      orderBy: { pattern: "asc" },
    })

    return rules.map(presentRule)
  }
}
