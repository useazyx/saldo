import type { ReactNode } from "react"

// Moldura das telas de entrar e criar conta: o que o Saldo faz de um lado, o formulário do outro
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between border-r border-border bg-surface px-12 py-10 lg:flex">
        <p className="text-xl font-semibold tracking-tight text-ink">Saldo</p>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink">
            Seu extrato vira um mapa de onde o dinheiro vai.
          </h2>
          <ul className="mt-8 space-y-4 text-ink-secondary">
            <li>Importe o CSV do banco. O que já foi importado não entra de novo.</li>
            <li>Regras simples categorizam sozinhas: "ifood" vai pra delivery, "uber" pra transporte.</li>
            <li>Veja o mês por categoria, a evolução e quanto sobra de cada orçamento.</li>
          </ul>
        </div>
        <p className="text-sm text-ink-muted">Seus dados ficam só na sua conta.</p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <p className="mb-8 text-xl font-semibold tracking-tight text-ink lg:hidden">Saldo</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </div>
  )
}
