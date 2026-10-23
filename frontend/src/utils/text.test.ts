import { describe, expect, it } from 'vitest'

import { insertAtSelection } from './text'

describe('insertAtSelection', () => {
  it('inserts into empty text without a leading space', () => {
    expect(insertAtSelection('', 0, 0, '∫ x^2 dx')).toEqual({ value: '∫ x^2 dx', cursor: 8 })
  })

  it('adds a single space after text that does not end in whitespace', () => {
    expect(insertAtSelection('Resuelve', 8, 8, 'x + 1')).toEqual({ value: 'Resuelve x + 1', cursor: 14 })
  })

  it('does not add a space after a space or a line break', () => {
    expect(insertAtSelection('Resuelve ', 9, 9, 'x').value).toBe('Resuelve x')
    expect(insertAtSelection('Resuelve\n', 9, 9, 'x').value).toBe('Resuelve\nx')
  })

  it('replaces the selected text', () => {
    expect(insertAtSelection('abc def', 4, 7, 'x')).toEqual({ value: 'abc x', cursor: 5 })
  })

  it('keeps the text after the cursor and places the cursor after the insertion', () => {
    expect(insertAtSelection('ab', 1, 1, 'X')).toEqual({ value: 'a Xb', cursor: 3 })
  })
})
