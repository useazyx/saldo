import { formatDate } from "../../lib/format"
import type { ImportPreview } from "../../lib/types"
import { Alert } from "../ui/Alert"
import { CategoryBadge } from "../ui/CategoryBadge"
import { Money } from "../ui/Money"

const FORMAT_LABELS: Record<ImportPreview["format"], string> = {
  "nubank-card": "Fatura do cartão Nubank",
  "nubank-account": "Extrato da conta Nubank",
  generic: "CSV com data, descrição e valor",
}

// Mostra só as primeiras linhas: é uma prévia, não o extrato inteiro
const MAX_ROWS = 50

export function ImportPreviewPanel({ preview }: { preview: ImportPreview }) {
  const uncategorized = preview.rows.filter((row) => !row.category).length

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Formato" value={FORMAT_LABELS[preview.format]} />
        <Stat label="Novos" value={String(preview.new_rows)} strong />
        <Stat label="Já importados" value={String(preview.duplicate_rows)} />
        <Stat label="Com problema" value={String(preview.errors.length)} />
      </dl>

      {preview.errors.length > 0 && (
        <Alert tone="warning">
          <p className="font-medium">
            {preview.errors.length === 1 ? "1 linha vai ser pulada:" : `${preview.errors.length} linhas vão ser puladas:`}
          </p>
          <ul className="mt-1 space-y-0.5">
            {preview.errors.slice(0, 5).map((error) => (
              <li key={error.line}>
                Linha {error.line}: {error.message}
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {uncategorized > 0 && (
        <Alert tone="info">
          {uncategorized === 1 ? "1 lançamento novo vai entrar sem categoria." : `${uncategorized} lançamentos novos vão entrar sem categoria.`}{" "}
          Dá pra criar regras em Categorias e aplicar depois.
        </Alert>
      )}

      {preview.rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Lançamentos novos</caption>
            <thead>
              <tr className="bg-page text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
                <th scope="col" className="px-4 py-2.5">Data</th>
                <th scope="col" className="py-2.5 pr-3">Descrição</th>
                <th scope="col" className="py-2.5 pr-3">Categoria</th>
                <th scope="col" className="py-2.5 pr-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, MAX_ROWS).map((row) => (
                <tr key={row.line} className="border-t border-border">
                  <td className="tabular whitespace-nowrap px-4 py-2.5 text-ink-secondary">{formatDate(row.occurred_on)}</td>
                  <td className="py-2.5 pr-3 text-ink">{row.description}</td>
                  <td className="py-2.5 pr-3"><CategoryBadge category={row.category} /></td>
                  <td className="py-2.5 pr-4 text-right font-medium"><Money cents={row.amount_cents} signed /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.rows.length > MAX_ROWS && (
            <p className="border-t border-border px-4 py-2.5 text-sm text-ink-muted">
              E mais {preview.rows.length - MAX_ROWS} lançamentos.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-page px-3 py-2">
      <dt className="text-xs text-ink-muted">{label}</dt>
      {/* Uma classe de tamanho só por vez (com text-sm e text-lg juntas, o CSS decide sozinho qual ganha) */}
      <dd className={`mt-0.5 ${strong ? "text-lg font-semibold text-ink" : "text-sm font-medium text-ink-secondary"}`}>{value}</dd>
    </div>
  )
}
