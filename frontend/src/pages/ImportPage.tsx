import { useMutation } from "@tanstack/react-query"
import { CircleCheck, FileSpreadsheet } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { useAuth } from "../auth/AuthContext"
import { ImportPreviewPanel } from "../components/imports/ImportPreviewPanel"
import { Alert } from "../components/ui/Alert"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"
import { Select } from "../components/ui/Select"
import { errorMessage } from "../lib/api"
import { formatDate } from "../lib/format"
import { useAccounts, useImportHistory } from "../lib/queries"
import type { ImportPreview, ImportResult } from "../lib/types"
import { useInvalidateFinance } from "../lib/useInvalidateFinance"

export function ImportPage() {
  const { request } = useAuth()
  const invalidate = useInvalidateFinance()
  const accounts = useAccounts()
  const history = useImportHistory()

  const [accountId, setAccountId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const selectedAccount = accountId || accounts.data?.[0]?.id || ""

  const previewMutation = useMutation({
    mutationFn: () =>
      request<ImportPreview>("/imports/preview", { method: "POST", query: { account_id: selectedAccount }, file: file! }),
    onSuccess: (data) => {
      setPreview(data)
      setResult(null)
    },
  })

  const confirmMutation = useMutation({
    mutationFn: () =>
      request<ImportResult>("/imports", { method: "POST", query: { account_id: selectedAccount }, file: file! }),
    onSuccess: async (data) => {
      setResult(data)
      setPreview(null)
      setFile(null)
      await invalidate()
    },
  })

  // Trocou arquivo ou conta: a prévia antiga não vale mais
  const reset = () => {
    setPreview(null)
    previewMutation.reset()
  }

  function handlePreview(event: FormEvent) {
    event.preventDefault()
    if (file && selectedAccount) previewMutation.mutate()
  }

  const error = previewMutation.error ?? confirmMutation.error

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Importar extrato</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Envie o CSV do banco. Extrato e fatura do Nubank são reconhecidos sozinhos; de outros bancos, basta o arquivo ter
          colunas de data, descrição e valor. O que já foi importado não entra de novo.
        </p>
      </header>

      {result && (
        <Alert tone="info">
          <p className="flex items-center gap-1.5 font-medium text-ink">
            <CircleCheck aria-hidden className="size-4 text-income" /> {result.file_name} importado
          </p>
          <p className="mt-0.5">
            {result.imported_rows} novos · {result.duplicate_rows} já existiam · {result.skipped_rows} pulados.{" "}
            <Link to={`/lancamentos?conta=${selectedAccount}`} className="font-medium text-action hover:underline">
              Ver lançamentos
            </Link>
          </p>
        </Alert>
      )}

      <Card title="1. Escolha a conta e o arquivo">
        {accounts.data?.length === 0 ? (
          <Alert tone="info">
            Primeiro cadastre a conta ou cartão desse extrato em{" "}
            <Link to="/contas" className="font-medium text-action hover:underline">Contas</Link>.
          </Alert>
        ) : (
          <form onSubmit={handlePreview} className="flex flex-col gap-4">
            <Select
              label="Conta"
              value={selectedAccount}
              onChange={(e) => {
                setAccountId(e.target.value)
                reset()
              }}
              className="sm:max-w-xs"
            >
              {accounts.data?.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </Select>

            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-border bg-page px-4 py-8 text-center transition-colors hover:border-action focus-within:border-action focus-within:ring-2 focus-within:ring-action/20">
              <FileSpreadsheet aria-hidden className="size-8 text-ink-muted" />
              <span className="text-sm font-medium text-ink">{file ? file.name : "Escolher arquivo CSV"}</span>
              <span className="text-xs text-ink-muted">Até 2 MB</span>
              <input
                type="file"
                accept=".csv,text/csv"
                aria-label="Arquivo CSV"
                className="sr-only"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null)
                  reset()
                }}
              />
            </label>

            <div>
              <Button type="submit" variant="secondary" disabled={!file || !selectedAccount} loading={previewMutation.isPending}>
                Ver prévia
              </Button>
            </div>
          </form>
        )}
      </Card>

      {error && <Alert>{errorMessage(error)}</Alert>}

      {preview && (
        <Card
          title="2. Confira antes de importar"
          action={
            <Button onClick={() => confirmMutation.mutate()} disabled={preview.new_rows === 0} loading={confirmMutation.isPending}>
              {preview.new_rows === 0
                ? "Nada novo pra importar"
                : `Importar ${preview.new_rows} ${preview.new_rows === 1 ? "lançamento" : "lançamentos"}`}
            </Button>
          }
        >
          <ImportPreviewPanel preview={preview} />
        </Card>
      )}

      <Card title="Importações anteriores">
        {history.data?.length ? (
          <ul className="divide-y divide-border">
            {history.data.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{item.file_name}</p>
                  <p className="text-xs text-ink-muted">
                    {item.account.name} · {formatDate(item.created_at.slice(0, 10))}
                  </p>
                </div>
                <p className="text-ink-secondary">
                  {item.imported_rows} novos · {item.duplicate_rows} repetidos · {item.skipped_rows} pulados
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nenhum extrato importado ainda.</p>
        )}
      </Card>
    </div>
  )
}
