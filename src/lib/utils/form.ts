/** Converte campos de FormData para strings, evitando erros de tipo do TS. */
export function formStrings(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    out[key] = String(value ?? '')
  }
  return out
}