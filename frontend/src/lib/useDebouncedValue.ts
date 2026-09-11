import { useEffect, useState } from "react"

// Espera a pessoa parar de digitar antes de buscar (uma chamada por busca, não uma por letra)
export function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
