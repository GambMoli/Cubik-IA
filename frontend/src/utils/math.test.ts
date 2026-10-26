import katex from 'katex'
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

  it('converts nested square roots and calls inside a root', () => {
    expect(plainMathToLatex('sqrt((x+1)^2)')).toBe('\\sqrt{(x+1)^2}')
    expect(plainMathToLatex('sqrt(sin(x))')).toBe('\\sqrt{\\sin(x)}')
    expect(plainMathToLatex('sqrt(abs(x))')).toBe('\\sqrt{\\left|x\\right|}')
  })

  it('groups an exponent or a subscript written in parentheses', () => {
    expect(plainMathToLatex('e^(x+1)')).toBe('e^{x+1}')
    expect(plainMathToLatex('a_(n)')).toBe('a_{n}')
    expect(plainMathToLatex('10^(2x)')).toBe('10^{2x}')
    expect(plainMathToLatex('x_(n)^(2)')).toBe('x_{n}^{2}')
    expect(plainMathToLatex('e^(sqrt(x))')).toBe('e^{\\sqrt{x}}')
  })

  it('converts the n-th root', () => {
    expect(plainMathToLatex('root(3, x)')).toBe('\\sqrt[3]{x}')
    expect(plainMathToLatex('root(n,x+1)')).toBe('\\sqrt[n]{x+1}')
    expect(plainMathToLatex('root(3, sqrt(x))')).toBe('\\sqrt[3]{\\sqrt{x}}')
  })

  it('converts absolute value, ceiling and floor', () => {
    expect(plainMathToLatex('abs(x-2)')).toBe('\\left|x-2\\right|')
    expect(plainMathToLatex('ceil(x)')).toBe('\\left\\lceil x\\right\\rceil ')
    expect(plainMathToLatex('floor(x/2)')).toBe('\\left\\lfloor x/2\\right\\rfloor ')
  })

  it('converts exp() with a nested call', () => {
    expect(plainMathToLatex('exp(2x)')).toBe('e^{2x}')
    expect(plainMathToLatex('exp(sin(x))')).toBe('e^{\\sin(x)}')
  })

  it('leaves an unclosed call as typed', () => {
    expect(plainMathToLatex('sqrt(x^2')).toBe('sqrt(x^2')
    expect(plainMathToLatex('e^(x+1')).toBe('e^(x+1')
  })

  it('does not treat a longer word that ends in a call name as that call', () => {
    expect(plainMathToLatex('2sqrt(x)')).toBe('2sqrt(x)')
    expect(plainMathToLatex('myabs(x)')).toBe('myabs(x)')
  })

  it('converts the Spanish and inverse trigonometric names and the logarithms', () => {
    expect(plainMathToLatex('tg(x) + arcsen(x) + ln(x) + log10(x)')).toBe(
      '\\tan(x) + \\arcsin(x) + \\ln(x) + \\log_{10}(x)',
    )
    expect(plainMathToLatex('arccos(x) + arctg(x)')).toBe('\\arccos(x) + \\arctan(x)')
    expect(plainMathToLatex('arcsin(x) + arctan(x)')).toBe('\\arcsin(x) + \\arctan(x)')
  })

  it('converts a logarithm with a base', () => {
    expect(plainMathToLatex('log_(2)(8)')).toBe('\\log_{2}(8)')
    expect(plainMathToLatex('log_(a+1)(x)')).toBe('\\log_{a+1}(x)')
  })

  it('converts a parenthesized fraction to a stacked fraction', () => {
    expect(plainMathToLatex('(x+1)/(x-1)')).toBe('\\frac{x+1}{x-1}')
    expect(plainMathToLatex('((a)+1)/(b)')).toBe('\\frac{(a)+1}{b}')
    expect(plainMathToLatex('(sin(x))/(2)')).toBe('\\frac{\\sin(x)}{2}')
    expect(plainMathToLatex('1 + (a)/(b) = c')).toBe('1 + \\frac{a}{b} = c')
  })

  it('does not stack a slash that follows a function, a variable or a number', () => {
    expect(plainMathToLatex('sin(x)/x')).toBe('\\sin(x)/x')
    expect(plainMathToLatex('sin(x)/(2)')).toBe('\\sin(x)/(2)')
    expect(plainMathToLatex('2(x)/(y)')).toBe('2(x)/(y)')
    expect(plainMathToLatex('d/dx (x^3)')).toBe('\\frac{d}{dx}\\left(x^3\\right)')
  })

  it('keeps an unclosed fraction as typed', () => {
    expect(plainMathToLatex('(x+1)/(x-1')).toBe('(x+1)/(x-1')
    expect(plainMathToLatex('(x+1)/')).toBe('(x+1)/')
  })

  it('converts the logic and set symbols', () => {
    expect(plainMathToLatex('a ∧ b ∨ ¬c')).toBe('a \\land  b \\lor  \\neg c')
    expect(plainMathToLatex('x ∈ A ⊂ B ⊆ C')).toBe('x \\in  A \\subset  B \\subseteq  C')
    expect(plainMathToLatex('a ⊗ b')).toBe('a \\otimes  b')
    expect(plainMathToLatex('l ∥ m ⊥ n')).toBe('l \\parallel  m \\perp  n')
    expect(plainMathToLatex('∠ A')).toBe('\\angle  A')
    expect(plainMathToLatex('a ≟ b')).toBe('a \\stackrel{?}{=} b')
    expect(plainMathToLatex('x → ∞')).toBe('x \\to  \\infty')
  })

  it('converts degrees and primes', () => {
    expect(plainMathToLatex('30°')).toBe('30{}^{\\circ}')
    expect(plainMathToLatex('f′(x) + f″(x)')).toBe('f{}^{\\prime}(x) + f{}^{\\prime\\prime}(x)')
    expect(() => katex.renderToString(plainMathToLatex('x^2° + f′″'), { throwOnError: true })).not.toThrow()
  })

  it('converts the Greek letters the calculator writes', () => {
    expect(plainMathToLatex('ζ η ι κ ξ υ χ ψ')).toBe(
      '\\zeta  \\eta  \\iota  \\kappa  \\xi  \\upsilon  \\chi  \\psi ',
    )
    expect(plainMathToLatex('Θ Λ Ξ Π Ψ')).toBe('\\Theta  \\Lambda  \\Xi  \\Pi  \\Psi ')
    expect(plainMathToLatex('Ζ Η')).toBe('Z H')
  })

  it('writes the two phi letters and the final sigma as different commands', () => {
    expect(plainMathToLatex('ϕ')).toBe('\\varphi ')
    expect(plainMathToLatex('φ')).toBe('\\phi ')
    expect(plainMathToLatex('ς')).toBe('\\varsigma ')
  })

  it('keeps × and ÷ as products and quotients', () => {
    expect(plainMathToLatex('3 × 4 ÷ 2 ≤ 7')).toBe('3 \\times  4 \\div  2 \\leq  7')
  })

  it('escapes the characters LaTeX treats as special', () => {
    expect(plainMathToLatex('50%')).toBe('50\\%')
    expect(plainMathToLatex('$5 & #1')).toBe('\\$5 \\& \\#1')
    expect(plainMathToLatex('{1, 2}')).toBe('\\{1, 2\\}')
    expect(plainMathToLatex('{{1,2},{3,4}}')).toBe('\\{\\{1,2\\},\\{3,4\\}\\}')
  })

  it('shows a lone backslash instead of dropping it', () => {
    expect(plainMathToLatex('A \\ B')).toBe('A \\backslash  B')
  })

  it('keeps hand-written LaTeX braces and escapes untouched', () => {
    expect(plainMathToLatex('x^{2} + 1')).toBe('x^{2} + 1')
    expect(plainMathToLatex('a_{1} + \\alpha{2}')).toBe('a_{1} + \\alpha{2}')
    expect(plainMathToLatex('\\{ 1 \\} + 5\\%')).toBe('\\{ 1 \\} + 5\\%')
  })

  it('keeps sen(x) as the sine', () => {
    expect(plainMathToLatex('sen(x)')).toBe('\\sin(x)')
    expect(plainMathToLatex('sen(x) + cos(x)')).toBe('\\sin(x) + \\cos(x)')
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

  it('previews the operators and symbols the calculator writes', () => {
    expect(getMathPreview('3 × 4 ÷ 2 ≤ 7')).toEqual({ kind: 'single', latex: '3 \\times  4 \\div  2 \\leq  7' })
    expect(getMathPreview('x ∈ A')).toEqual({ kind: 'single', latex: 'x \\in  A' })
    expect(getMathPreview('ζ ∧ ψ ∈ A ⊂ B → ∞')).toEqual({
      kind: 'single',
      latex: '\\zeta  \\land  \\psi  \\in  A \\subset  B \\to  \\infty',
    })
    expect(getMathPreview('α')).toEqual({ kind: 'single', latex: '\\alpha ' })
  })

  it('previews a fraction, a grouped exponent and a root', () => {
    expect(getMathPreview('(x+1)/(x-1)')).toEqual({ kind: 'single', latex: '\\frac{x+1}{x-1}' })
    expect(getMathPreview('e^(x+1) + a_(n)')).toEqual({ kind: 'single', latex: 'e^{x+1} + a_{n}' })
    expect(getMathPreview('sqrt(x) + root(3, x) + abs(x-2)')).toEqual({
      kind: 'single',
      latex: '\\sqrt{x} + \\sqrt[3]{x} + \\left|x-2\\right|',
    })
  })
})

describe('calculator output renders in KaTeX', () => {
  // Everything a calculator key can write, alone and inside a template, must be valid for KaTeX.
  const written = [
    'x y π e',
    'x^2',
    '^()',
    'x^(2)',
    'sqrt()',
    'sqrt(x)',
    'abs()',
    'abs(x)',
    '()/()',
    '(a)/(b)',
    '_()^()',
    'x_(1)^(2)',
    '1.5 , ( ) < > = + - × ÷',
    'sen() cos() tg()',
    'sen(x) cos(x) tg(x)',
    'arcsen() arccos() arctg()',
    'arcsen(x) arccos(x) arctg(x)',
    'ln() log10() log_()()',
    'ln(x) log10(x) log_(2)(x)',
    'e^() 10^() root(,)',
    'e^(x) 10^(2) root(3, x)',
    'd/dx() ∫  dx',
    'd/dx(x^2)',
    '∫ x dx',
    '% ! $ ° { } ≤ ≥ i',
    'ceil() floor()',
    'ceil(x) floor(x)',
    '∞ ≟ ≠ ∧ ∨ ¬ ⊗ [ ] ∥ ⊥ ∈ ⊂ ⊆ ∠ →',
    '(,) (;) {{,},{,}}',
    '\\ & @ # $ ; : \' " ′ ″',
    'q w e r t y u i o p a s d f g h j k l ñ z x c v b n m ï ü ´',
    'ϕ ς ε ρ τ υ θ ι ο π α σ δ φ γ η ξ κ λ ζ χ ψ ω β ν μ',
    'Φ Σ Ε Ρ Τ Υ Θ Ι Ο Π Α Δ Γ Η Ξ Κ Λ Ζ Χ Ψ Ω Β Ν Μ',
  ]

  it.each(written)('renders "%s" without a KaTeX error', (text) => {
    const latex = plainMathToLatex(text)
    expect(() => katex.renderToString(latex, { throwOnError: true, strict: 'ignore' })).not.toThrow()
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
