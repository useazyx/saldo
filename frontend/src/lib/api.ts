import type { ApiErrorBody } from "./types"

// Sem .env o front fala com /api, e o proxy do Vite leva pra API na porta 3336
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api"

export const OFFLINE_MESSAGE =
  "Não consegui falar com a API. Confere se o backend está rodando (npm run dev na pasta backend)."

// Erro da API no formato { error, message } que o backend sempre devolve
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public issues: ApiErrorBody["issues"] = []
  ) {
    super(message)
  }
}

type QueryValue = string | number | undefined | null

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, QueryValue>
  token?: string | null
  file?: File
}

function buildUrl(path: string, query: RequestOptions["query"]) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  }
  const search = params.toString()
  return `${BASE_URL}${path}${search ? `?${search}` : ""}`
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  let body: BodyInit | undefined
  if (options.file) {
    const form = new FormData()
    form.append("file", options.file)
    body = form
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), { method: options.method ?? "GET", headers, body })
  } catch {
    throw new ApiError(0, "ApiOffline", OFFLINE_MESSAGE)
  }

  if (response.status === 204) return undefined as T

  const data = (await response.json().catch(() => null)) as (T & Partial<ApiErrorBody>) | null

  if (!response.ok) {
    // Com o backend desligado, o proxy do Vite responde 5xx sem JSON
    if (!data && response.status >= 500) throw new ApiError(response.status, "ApiOffline", OFFLINE_MESSAGE)
    throw new ApiError(
      response.status,
      data?.error ?? "RequestError",
      data?.message ?? "Algo deu errado. Tenta de novo.",
      data?.issues
    )
  }

  return data as T
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Algo deu errado. Tenta de novo."
