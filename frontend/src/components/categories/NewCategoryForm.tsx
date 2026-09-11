import { useMutation } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"
import { useAuth } from "../../auth/AuthContext"
import { errorMessage } from "../../lib/api"
import type { CategoryColor, CategoryKind } from "../../lib/types"
import { useInvalidateFinance } from "../../lib/useInvalidateFinance"
import { Alert } from "../ui/Alert"
import { Button } from "../ui/Button"
import { SegmentedControl } from "../ui/SegmentedControl"
import { TextField } from "../ui/TextField"
import { ColorPicker } from "./ColorPicker"

export function NewCategoryForm() {
  const { request } = useAuth()
  const invalidate = useInvalidateFinance()
  const [name, setName] = useState("")
  const [kind, setKind] = useState<CategoryKind>("EXPENSE")
  const [color, setColor] = useState<CategoryColor>("blue")

  const create = useMutation({
    mutationFn: () => request("/categories", { method: "POST", body: { name: name.trim(), kind, color } }),
    onSuccess: async () => {
      setName("")
      await invalidate()
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (name.trim().length >= 2) create.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {create.error && <Alert>{errorMessage(create.error)}</Alert>}
      <div className="flex flex-wrap items-end gap-3">
        <TextField label="Nova categoria" placeholder="Ex.: Pets" value={name} onChange={(e) => setName(e.target.value)} className="min-w-48 flex-1" />
        <SegmentedControl
          label="Tipo da categoria"
          value={kind}
          onChange={setKind}
          options={[
            { value: "EXPENSE", label: "Saída" },
            { value: "INCOME", label: "Entrada" },
          ]}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ColorPicker value={color} onChange={setColor} />
        <Button type="submit" loading={create.isPending} disabled={name.trim().length < 2}>
          Criar categoria
        </Button>
      </div>
    </form>
  )
}
