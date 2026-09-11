/**
 * seed.ts - Dados de demonstração pra o painel abrir com vida
 * # Pra que serve?
 * - Criar a Ana, com conta e cartão, regras de categoria e 4 meses de lançamentos até o mês atual
 * - Deixar um Pix sem categoria de propósito (pra tela de "falta organizar" ter o que mostrar)
 * - Definir alguns orçamentos do mês, um deles estourado
 * - Rodar em todo `npm run dev` sem duplicar nada (upsert e skipDuplicates em tudo)
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 *
 * Como rodar:
 *   npx prisma db seed
 * O `npm run dev` já chama ele automaticamente.
 */

import { pathToFileURL } from "node:url"
import { DEFAULT_CATEGORIES } from "../src/config/defaultCategories.js"
import { prisma } from "../src/config/prisma.js"
import { buildCategoryMatcher } from "../src/utils/categoryMatcher.js"
import { listMonths, monthRange } from "../src/utils/month.js"
import { hashPassword } from "../src/utils/password.js"

export const DEMO_EMAIL = "ana@saldo.dev"
export const DEMO_PASSWORD = "saldo123"

const MONTHS_OF_HISTORY = 4

// Texto da descrição -> categoria, igual uma pessoa configuraria
const DEMO_RULES: { pattern: string; category: string }[] = [
  { pattern: "ifood", category: "Restaurantes e delivery" },
  { pattern: "uber", category: "Transporte" },
  { pattern: "supermercado", category: "Mercado" },
  { pattern: "netflix", category: "Assinaturas" },
  { pattern: "spotify", category: "Assinaturas" },
  { pattern: "drogasil", category: "Saúde" },
  { pattern: "cinemark", category: "Lazer" },
  { pattern: "amazon", category: "Compras" },
  { pattern: "aluguel", category: "Moradia" },
  { pattern: "enel", category: "Moradia" },
  { pattern: "salario", category: "Salário" },
  { pattern: "freelance", category: "Renda extra" },
]

// Orçamento do mês atual (Restaurantes vai estourar com os dados abaixo)
const DEMO_BUDGETS: { category: string; limit_cents: number }[] = [
  { category: "Mercado", limit_cents: 60000 },
  { category: "Restaurantes e delivery", limit_cents: 12000 },
  { category: "Lazer", limit_cents: 15000 },
  { category: "Compras", limit_cents: 25000 },
]

type DemoAccount = "conta" | "cartao"

interface DemoEntry {
  day: number
  description: string
  amount_cents: number
  account: DemoAccount
}

// O mês "típico" da Ana; o índice do mês varia um pouco os valores pra evolução não ficar reta
function entriesForMonth(index: number): DemoEntry[] {
  const entries: DemoEntry[] = [
    { day: 5, description: "Salario ACME Tecnologia", amount_cents: 650000, account: "conta" },
    { day: 10, description: "Aluguel apartamento", amount_cents: -180000, account: "conta" },
    { day: 12, description: "Conta de luz Enel", amount_cents: -(17800 + index * 1500), account: "conta" },
    { day: 3, description: "Supermercado Pao de Acucar", amount_cents: -(31800 + index * 2100), account: "conta" },
    { day: 17, description: "Supermercado Dia", amount_cents: -21450, account: "conta" },
    { day: 14, description: "Drogasil", amount_cents: -8740, account: "conta" },
    { day: 18, description: "PIX ENVIADO - JOAO PEDRO", amount_cents: -5000, account: "conta" },
    { day: 1, description: "Netflix.com", amount_cents: -5590, account: "cartao" },
    { day: 2, description: "Spotify", amount_cents: -2190, account: "cartao" },
    { day: 8, description: "IFOOD *RESTAURANTE SABOR", amount_cents: -4590, account: "cartao" },
    { day: 15, description: "IFOOD *PIZZARIA BELLA", amount_cents: -(6200 + index * 800), account: "cartao" },
    { day: 22, description: "IFOOD *SUSHI HOUSE", amount_cents: -3850, account: "cartao" },
    { day: 6, description: "Uber *Trip", amount_cents: -2310, account: "cartao" },
    { day: 19, description: "Uber *Trip", amount_cents: -1870, account: "cartao" },
    { day: 25, description: "Cinemark Shopping", amount_cents: -9600, account: "cartao" },
    { day: 27, description: "Amazon Marketplace", amount_cents: -(15990 + index * 3000), account: "cartao" },
  ]

  // Freela entra de dois em dois meses
  if (index % 2 === 1) {
    entries.push({ day: 20, description: "Pix recebido - projeto freelance", amount_cents: 120000, account: "conta" })
  }

  return entries
}

export async function seed(now = new Date()) {
  const user = await upsertDemoUser()

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((category) => ({ ...category, user_id: user.id })),
    skipDuplicates: true,
  })
  const categories = await prisma.category.findMany({ where: { user_id: user.id }, select: { id: true, name: true } })
  const categoryId = (name: string) => categories.find((category) => category.name === name)!.id

  const accounts = {
    conta: await upsertAccount(user.id, "Conta Nubank"),
    cartao: await upsertAccount(user.id, "Cartão Nubank"),
  }

  await prisma.categoryRule.createMany({
    data: DEMO_RULES.map((rule) => ({ user_id: user.id, pattern: rule.pattern, category_id: categoryId(rule.category) })),
    skipDuplicates: true,
  })

  await seedTransactions(user.id, accounts, DEMO_RULES.map((rule) => ({ pattern: rule.pattern, category_id: categoryId(rule.category) })), now)

  const currentMonth = now.toISOString().slice(0, 7)
  for (const budget of DEMO_BUDGETS) {
    await prisma.budget.upsert({
      where: { category_id_month: { category_id: categoryId(budget.category), month: monthRange(currentMonth).start } },
      update: { limit_cents: budget.limit_cents },
      create: {
        user_id: user.id,
        category_id: categoryId(budget.category),
        month: monthRange(currentMonth).start,
        limit_cents: budget.limit_cents,
      },
    })
  }
}

async function upsertDemoUser() {
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Ana Souza", password_hash: passwordHash },
    create: { name: "Ana Souza", email: DEMO_EMAIL, password_hash: passwordHash },
    select: { id: true },
  })
}

async function upsertAccount(userId: string, name: string) {
  const account = await prisma.account.upsert({
    where: { user_id_name: { user_id: userId, name } },
    update: {},
    create: { user_id: userId, name },
    select: { id: true },
  })
  return account.id
}

// A digital é fixa (seed:mês:posição), então rodar de novo não cria nada
async function seedTransactions(
  userId: string,
  accounts: Record<DemoAccount, string>,
  rules: { pattern: string; category_id: string }[],
  now: Date
) {
  const matchCategory = buildCategoryMatcher(rules)
  const today = now.toISOString().slice(0, 10)
  const months = listMonths(now.toISOString().slice(0, 7), MONTHS_OF_HISTORY)

  const data = months.flatMap((month, index) =>
    entriesForMonth(index)
      .map((entry, position) => ({ ...entry, position, date: `${month}-${String(entry.day).padStart(2, "0")}` }))
      // Nada no futuro: no mês atual só entra o que já aconteceu
      .filter((entry) => entry.date <= today)
      .map((entry) => ({
        user_id: userId,
        account_id: accounts[entry.account],
        category_id: matchCategory(entry.description),
        occurred_on: new Date(`${entry.date}T00:00:00.000Z`),
        description: entry.description,
        amount_cents: entry.amount_cents,
        fingerprint: `seed:${month}:${entry.position}`,
      }))
  )

  await prisma.transaction.createMany({ data, skipDuplicates: true })
}

// Só roda sozinho quando chamado direto (o teste importa a função sem disparar o seed)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .then(() => console.log(`🌱 Seed pronto. Login de demonstração: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`))
    .catch((error) => {
      console.error("❌ Deu ruim no seed:", error)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
