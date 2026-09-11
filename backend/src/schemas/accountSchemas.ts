/**
 * accountSchemas.ts - O formato das contas e cartões
 * # Pra que serve?
 * - Validar criação e renomeação de conta
 * - Descrever a conta nas respostas, já com saldo e quantidade de lançamentos
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

import { z } from "zod"

export const ACCOUNT_BODY_SCHEMA = z.object({
  name: z.string().trim().min(2, "Nome da conta precisa de pelo menos 2 letras").max(40),
})

export const ACCOUNT_SCHEMA = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  // Soma de todos os lançamentos (negativo quando saiu mais do que entrou)
  balance_cents: z.number().int(),
  transactions_count: z.number().int(),
})

export type AccountBody = z.infer<typeof ACCOUNT_BODY_SCHEMA>
