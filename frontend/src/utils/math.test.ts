import { describe, expect, it } from 'vitest'

import {
  extractMathCandidateForPreview,
  getMathPreview,
  looksLikeLatex,
  parseLabelledParagraph,
  plainMathToLatex,
  sanitizeParagraph,
  shouldRenderStandaloneMath,
  splitBlockMath,
  splitInlineMath,
} from './math'

describe('plainMathToLatex', () => {
  it('keeps a plain equation readable as LaTeX', () => {
    expect(plainMathToLatex('x^2 + 3x = 10')).toBe('x^2 + 3x = 10')
  })

  it('converts an integral', () => {
    expect(plainMathToLatex('∫ x^2 dx')).toBe('\\int x^2\\, dx')
  })

  it('converts the "por partes" integral', () => {
    expect(plainMathToLatex('∫ x e^x dx')).toBe('\\int x e^x\\, dx')
  })

  it('converts a derivative', () => {
    expect(plainMathToLatex('d/dx (x^3 + 2x)')).toBe('\\frac{d}{dx}\\left(x^3 + 2x\\right)')
  })

  it('converts a limit', () => {
    expect(plainMathToLatex('lim x->0 sin(x)/x')).toBe('\\lim_{x \\to 0} \\sin(x)/x')
  })

  it('converts a square root', () => {
    expect(plainMathToLatex('sqrt(x^2 + 1)')).toBe('\\sqrt{x^2 + 1}')
  })

  it('converts ** to a power and * to a space', () => {
    expect(plainMathToLatex('2*x**3')).toBe('2 x^3')
  })

  it('converts unicode superscripts', () => {
    expect(plainMathToLatex('x²')).toBe('x^2')
  })

  it('does not double the backslash of a converted pi', () => {
    expect(plainMathToLatex('2π')).toBe('2\\pi ')
    expect(plainMathToLatex('2 pi')).toBe('2 \\pi')
  })

  it('leaves input that is already LaTeX untouched', () => {
    expect(plainMathToLatex('\\frac{1}{2}')).toBe('\\frac{1}{2}')
    expect(plainMathToLatex('\\sin x + 1')).toBe('\\sin x + 1')
  })

  it('returns an empty string for blank input', () => {
    expect(plainMathToLatex('   ')).toBe('')
  })
})

describe('extractMathCandidateForPreview', () => {
  it('returns the last line that contains math', () => {
    expect(extractMathCandidateForPreview('Resuelve\nx^2 = 4\ngracias')).toBe('x^2 = 4')
  })

  it('returns null when no line contains math', () => {
    expect(extractMathCandidateForPreview('hola mundo')).toBeNull()
  })
})

describe('getMathPreview', () => {
  it('shows nothing for an empty input', () => {
    expect(getMathPreview('')).toEqual({ kind: 'none' })
  })

  it('shows nothing for plain words', () => {
    expect(getMathPreview('hola mundo')).toEqual({ kind: 'none' })
  })

  it('previews a single expression', () => {
    expect(getMathPreview('lim x->0 sin(x)/x')).toEqual({
      kind: 'single',
      latex: '\\lim_{x \\to 0} \\sin(x)/x',
    })
  })

  it('previews one formula per math line when there are several', () => {
    expect(getMathPreview('x + 1 = 2\n\ny^2 = 9')).toEqual({ kind: 'lines', lines: ['x + 1 = 2', 'y^2 = 9'] })
  })

  it('previews block delimiters as a rendered message', () => {
    expect(getMathPreview('\\[ \\int x\\,dx \\]')).toEqual({ kind: 'block' })
  })
})

describe('splitBlockMath', () => {
  it('splits text and block formulas in order', () => {
    expect(splitBlockMath('antes \\[ a+b \\] después')).toEqual([
      { kind: 'text', content: 'antes ' },
      { kind: 'block', content: 'a+b' },
      { kind: 'text', content: ' después' },
    ])
  })

  it('drops empty segments', () => {
    expect(splitBlockMath('\\[ x \\]')).toEqual([{ kind: 'block', content: 'x' }])
  })

  it('returns the whole text when there are no block formulas', () => {
    expect(splitBlockMath('solo texto')).toEqual([{ kind: 'text', content: 'solo texto' }])
  })
})

describe('splitInlineMath', () => {
  it('splits an inline formula out of a sentence', () => {
    expect(splitInlineMath('the value \\( x^2 \\) grows')).toEqual([
      { kind: 'text', content: 'the value ' },
      { kind: 'math', content: ' x^2 ' },
      { kind: 'text', content: ' grows' },
    ])
  })
})

describe('shouldRenderStandaloneMath', () => {
  it('treats a short plain expression as math', () => {
    expect(shouldRenderStandaloneMath('x^2 + 3x = 10')).toBe(true)
    expect(shouldRenderStandaloneMath('∫ x^2 dx')).toBe(true)
  })

  it('counts single letters as variables, not words', () => {
    expect(shouldRenderStandaloneMath('f(x) = x^2')).toBe(true)
    expect(shouldRenderStandaloneMath('ln(x) + 1')).toBe(true)
  })

  it('treats LaTeX commands as math', () => {
    expect(shouldRenderStandaloneMath('\\frac{1}{2}')).toBe(true)
  })

  it('keeps short phrases that contain a real word as text', () => {
    expect(shouldRenderStandaloneMath('despejamos x = 4')).toBe(false)
  })

  it('keeps narrative sentences as text', () => {
    expect(shouldRenderStandaloneMath('Primero despejamos la variable x.')).toBe(false)
  })

  it('rejects blank text', () => {
    expect(shouldRenderStandaloneMath('  ')).toBe(false)
  })
})

describe('paragraph helpers', () => {
  it('detects LaTeX commands', () => {
    expect(looksLikeLatex('\\sqrt{2}')).toBe(true)
    expect(looksLikeLatex('hola')).toBe(false)
  })

  it('parses the labels Ejercicio, Pista and Resultado final', () => {
    expect(parseLabelledParagraph('Resultado final: x = 2')).toEqual({ label: 'Resultado final', rest: 'x = 2' })
    expect(parseLabelledParagraph('Pista:')).toEqual({ label: 'Pista', rest: '' })
    expect(parseLabelledParagraph('Otra cosa: x')).toBeNull()
  })

  it('drops paragraphs that are empty, undefined or null', () => {
    expect(sanitizeParagraph('  ')).toBe('')
    expect(sanitizeParagraph('undefined')).toBe('')
    expect(sanitizeParagraph('null')).toBe('')
    expect(sanitizeParagraph(' hola ')).toBe('hola')
  })
})
