# Saldo

Controle financeiro pessoal a partir do extrato do banco. Você importa o CSV que o banco exporta,
regras simples categorizam, e dá pra ver pra onde o dinheiro foi em cada mês: gastos por categoria,
a evolução dos últimos meses e quanto sobra de cada orçamento.

## Tecnologias

- **Backend:** Node.js 22, TypeScript, Fastify 5, Prisma 6, PostgreSQL, Zod 4
- **Frontend:** React 19, Vite, Tailwind CSS 4, TanStack Query, Recharts
- **Testes:** Vitest nos dois lados (a API contra um PostgreSQL de verdade, a interface com Testing Library)

## Como rodar

Precisa de Node.js 22.12+ e PostgreSQL rodando em `localhost:5432`.

```bash
cd backend
npm install
npm run dev        # http://localhost:3336, documentação em /docs
```

```bash
cd frontend
npm install
npm run dev        # http://localhost:5176
```

O `npm run dev` do backend cria o `.env` a partir do `.env.example` (com um JWT secret aleatório),
cria o banco, aplica as migrations e carrega uma conta de demonstração. O frontend repassa `/api`
pro backend, então não tem mais nada pra configurar. Se o seu usuário do Postgres não for
`postgres/postgres`, ajuste o `DATABASE_URL` em `backend/.env`.

**Conta de demonstração:** `ana@saldo.dev` / `saldo123`, com conta corrente, cartão de crédito,
regras, quatro meses de lançamentos e alguns orçamentos (um deles já estourado).

## O que faz

- **Importa extratos** do Nubank (conta e cartão são reconhecidos pelo cabeçalho) ou qualquer CSV com
  colunas de data, descrição e valor. Vírgula ou ponto e vírgula, número brasileiro ou americano,
  data `DD/MM/AAAA` ou ISO, UTF-8 ou Latin-1. Antes de importar aparece a prévia: o que é novo, o que
  já existia, a categoria sugerida e as linhas que vão ser puladas, com o motivo.
- **Categoriza sozinho** com regras do tipo "descrição contém `ifood` → Restaurantes". A regra mais
  específica ganha (`uber eats` antes de `uber`), e uma regra nova pode ser aplicada no que já está
  sem categoria, sem mexer no que foi escolhido à mão.
- **Lançamentos** com filtros que ficam na URL (mês, conta, categoria, tipo, busca), troca de
  categoria na própria lista, lançamento manual pra dinheiro vivo e totais do que está filtrado.
- **Painel** com o saldo do mês, entradas e saídas comparadas com o mês anterior, gastos por
  categoria e a evolução de seis meses.
- **Orçamentos** por categoria e mês, com a situação (ok, perto do limite, estourou) e um botão pra
  copiar os limites do mês anterior.

## Decisões de projeto

- **Reimportar nunca duplica.** Cada linha ganha uma digital (data, valor, descrição e quantas linhas
  iguais vieram antes no mesmo arquivo), única por conta no banco. Dois cafés iguais no mesmo dia são
  dois lançamentos; importar o mesmo arquivo de novo não acrescenta nenhum.
- **Valor é inteiro em centavos, com sinal.** Saída é negativa. O CSV do cartão do Nubank lista a
  compra como positiva, então esse formato tem o sinal invertido na importação.
- **Os relatórios são somados no PostgreSQL**, e não em JavaScript: `GROUP BY` pra categorias e
  orçamentos, e uma consulta só com `date_trunc` pra evolução mensal, com os meses vazios preenchidos.
- **As cores seguem uma paleta validada pra daltonismo.** A categoria guarda o nome do matiz, não o
  hex, então a interface escolhe o tom certo pro tema claro ou escuro. São exatamente oito matizes;
  passando de sete categorias, o gráfico junta o resto em "Outras" em vez de inventar cor. Situação
  (orçamento estourado) sempre vem com ícone e texto, nunca só com cor, e todo gráfico tem uma versão
  em tabela pra leitor de tela.
- Toda consulta é limitada ao usuário logado; o id de outra pessoa responde 404, não 403. Login e
  cadastro têm rate limit próprio, e todo erro volta como `{ error, message }`.

## Testes

```bash
cd backend && npm test     # API: autenticação, contas, leitura de CSV, importação, regras, relatórios, orçamentos, seed
cd frontend && npm test    # Interface: login, painel, lançamentos, importação, categorias, orçamentos, contas
```
