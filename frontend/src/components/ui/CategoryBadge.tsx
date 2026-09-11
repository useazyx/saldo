import { categoryColorVar } from "../../lib/categoryColors"
import type { CategoryRef } from "../../lib/types"

// A cor fica numa bolinha ao lado; o texto continua na cor normal (legível em qualquer categoria)
export function CategoryBadge({ category }: { category: Pick<CategoryRef, "name" | "color"> | null }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 text-sm text-ink-secondary">
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full"
        style={{ background: categoryColorVar(category?.color) }}
      />
      <span className="truncate">{category?.name ?? "Sem categoria"}</span>
    </span>
  )
}
