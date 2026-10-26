import { describe, expect, it } from 'vitest'

import { deleteBackward, insertText, moveCursor } from './text'

describe('insertText', () => {
  it('writes at the end with no added space', () => {
    expect(insertText('2', 1, 1, 'x')).toEqual({ value: '2x', selectionStart: 2, selectionEnd: 2 })
  })

  it('writes in the middle and keeps the text after the cursor', () => {
    expect(insertText('ab', 1, 1, '7')).toEqual({ value: 'a7b', selectionStart: 2, selectionEnd: 2 })
  })

  it('replaces the selected text', () => {
    expect(insertText('abc def', 4, 7, 'x')).toEqual({ value: 'abc x', selectionStart: 5, selectionEnd: 5 })
  })

  it('puts the cursor inside a template', () => {
    expect(insertText('', 0, 0, 'sqrt()', 5)).toEqual({ value: 'sqrt()', selectionStart: 5, selectionEnd: 5 })
    expect(insertText('2 ', 2, 2, '∫  dx', 2)).toEqual({ value: '2 ∫  dx', selectionStart: 4, selectionEnd: 4 })
  })

  it('keeps the caret offset relative to the start of a replaced selection', () => {
    expect(insertText('abc', 1, 3, 'abs()', 4)).toEqual({ value: 'aabs()', selectionStart: 5, selectionEnd: 5 })
  })

  it('clamps a caret or selection that is out of range', () => {
    expect(insertText('ab', 5, 9, 'x')).toEqual({ value: 'abx', selectionStart: 3, selectionEnd: 3 })
    expect(insertText('ab', 0, 0, 'x', 99).selectionStart).toBe(1)
  })
})

describe('deleteBackward', () => {
  it('deletes the character before the cursor', () => {
    expect(deleteBackward('x+1', 3, 3)).toEqual({ value: 'x+', selectionStart: 2, selectionEnd: 2 })
  })

  it('deletes the selection', () => {
    expect(deleteBackward('x+1', 1, 3)).toEqual({ value: 'x', selectionStart: 1, selectionEnd: 1 })
  })

  it('does nothing at the start of the text', () => {
    expect(deleteBackward('x+1', 0, 0)).toEqual({ value: 'x+1', selectionStart: 0, selectionEnd: 0 })
    expect(deleteBackward('', 0, 0)).toEqual({ value: '', selectionStart: 0, selectionEnd: 0 })
  })

  it('deletes only the character before the cursor in the middle of the text', () => {
    expect(deleteBackward('abc', 2, 2)).toEqual({ value: 'ac', selectionStart: 1, selectionEnd: 1 })
  })

  it('deletes a character outside the basic plane as one', () => {
    expect(deleteBackward('a𝑥', 3, 3)).toEqual({ value: 'a', selectionStart: 1, selectionEnd: 1 })
  })
})

describe('moveCursor', () => {
  it('moves one character left and right without changing the text', () => {
    expect(moveCursor('abc', 3, 3, -1)).toEqual({ value: 'abc', selectionStart: 2, selectionEnd: 2 })
    expect(moveCursor('abc', 1, 1, 1)).toEqual({ value: 'abc', selectionStart: 2, selectionEnd: 2 })
  })

  it('stops at both ends of the text', () => {
    expect(moveCursor('abc', 0, 0, -1).selectionStart).toBe(0)
    expect(moveCursor('abc', 3, 3, 1).selectionStart).toBe(3)
  })

  it('collapses a selection to its start when moving left and to its end when moving right', () => {
    expect(moveCursor('abcd', 1, 3, -1)).toEqual({ value: 'abcd', selectionStart: 1, selectionEnd: 1 })
    expect(moveCursor('abcd', 1, 3, 1)).toEqual({ value: 'abcd', selectionStart: 3, selectionEnd: 3 })
  })
})
