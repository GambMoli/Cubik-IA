export interface TextEdit {
  value: string
  selectionStart: number
  selectionEnd: number
}

function clampSelection(text: string, start: number, end: number): [number, number] {
  const from = Math.min(Math.max(start, 0), text.length)
  const to = Math.min(Math.max(end, from), text.length)
  return [from, to]
}

// Writes `insertion` over the selection [start, end) with no extra spaces. `caret` is the offset
// inside `insertion` where the cursor ends up (default: right after it), used by templates like `sqrt()`.
export function insertText(
  text: string,
  start: number,
  end: number,
  insertion: string,
  caret: number = insertion.length,
): TextEdit {
  const [from, to] = clampSelection(text, start, end)
  const position = from + Math.min(Math.max(caret, 0), insertion.length)

  return {
    value: `${text.slice(0, from)}${insertion}${text.slice(to)}`,
    selectionStart: position,
    selectionEnd: position,
  }
}

// Deletes the selection, or the character before the cursor when nothing is selected.
export function deleteBackward(text: string, start: number, end: number): TextEdit {
  const [from, to] = clampSelection(text, start, end)

  if (from === to && from === 0) {
    return { value: text, selectionStart: 0, selectionEnd: 0 }
  }

  let deleteFrom = from
  if (from === to) {
    // A character outside the BMP is two UTF-16 units; delete both so no lone surrogate is left.
    const previous = text.charCodeAt(from - 1)
    const beforePrevious = from >= 2 ? text.charCodeAt(from - 2) : 0
    const isPair = previous >= 0xdc00 && previous <= 0xdfff && beforePrevious >= 0xd800 && beforePrevious <= 0xdbff
    deleteFrom = from - (isPair ? 2 : 1)
  }

  return {
    value: `${text.slice(0, deleteFrom)}${text.slice(to)}`,
    selectionStart: deleteFrom,
    selectionEnd: deleteFrom,
  }
}

// Moves the cursor one position; a selection collapses to its start (left) or end (right).
export function moveCursor(text: string, start: number, end: number, by: -1 | 1): TextEdit {
  const [from, to] = clampSelection(text, start, end)
  const position = from !== to ? (by < 0 ? from : to) : Math.min(Math.max(from + by, 0), text.length)

  return { value: text, selectionStart: position, selectionEnd: position }
}
