export interface InsertionResult {
  value: string
  cursor: number
}

// Replaces the selection [start, end) with `insertion`, adding a space before it when the
// preceding character is not whitespace. `cursor` is the position right after the insertion.
export function insertAtSelection(text: string, start: number, end: number, insertion: string): InsertionResult {
  const prefix = text.slice(0, start)
  const suffix = text.slice(end)
  const glue = prefix && !prefix.endsWith(' ') && !prefix.endsWith('\n') ? ' ' : ''

  return {
    value: `${prefix}${glue}${insertion}${suffix}`,
    cursor: (prefix + glue + insertion).length,
  }
}
