/**
 * helpers.ts - Atalhos que todo teste usa
 * # Pra que serve?
 * - Subir a API sem abrir porta (buildApp + inject)
 * - Limpar o banco entre um teste e outro
 * - Criar conta e já pegar o token, pra não repetir isso em todo arquivo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.2.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 * - v1.1.0 (2026-09-11): resetDatabase, createUserAndLogin e authHeader
 * - v1.2.0 (2026-09-11): multipartFile pra testar upload
 */

import { randomUUID } from "node:crypto"
import { buildApp } from "../src/app.js"
import { prisma } from "../src/config/prisma.js"

export type TestApp = Awaited<ReturnType<typeof buildApp>>

export async function createTestApp(options: Parameters<typeof buildApp>[0] = {}) {
  const app = await buildApp(options)
  await app.ready()
  return app
}

// Apaga tudo de uma vez (CASCADE leva junto o que depende)
export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "budgets", "category_rules", "transactions", "statement_imports", "categories", "accounts", "users" RESTART IDENTITY CASCADE'
  )
}

// Cadastra e loga, devolvendo o token e o usuário
export async function createUserAndLogin(app: TestApp, name = "Pessoa de Teste") {
  const email = `${randomUUID()}@teste.com`
  const password = "senha-de-teste-123"

  const register = await app.inject({ method: "POST", url: "/auth/register", payload: { name, email, password } })
  const login = await app.inject({ method: "POST", url: "/auth/login", payload: { email, password } })

  return {
    user: register.json() as { id: string; name: string; email: string },
    token: login.json().token as string,
    email,
    password,
  }
}

export const authHeader = (token: string) => ({ authorization: `Bearer ${token}` })

// Monta um upload multipart na mão (o inject não tem FormData), já com o token
export function multipartFile(token: string, fileName: string, content: string | Buffer) {
  const boundary = "----saldo-test-boundary"
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: text/csv\r\n\r\n`
  )
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)

  return {
    payload: Buffer.concat([head, Buffer.isBuffer(content) ? content : Buffer.from(content), tail]),
    headers: { ...authHeader(token), "content-type": `multipart/form-data; boundary=${boundary}` },
  }
}
