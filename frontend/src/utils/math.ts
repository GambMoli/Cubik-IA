export interface MathSegment {
  kind: 'text' | 'block'
  content: string
}

export interface InlineSegment {
  kind: 'text' | 'math'
  content: string
}

export type MathPreview =
  | { kind: 'none' }
  | { kind: 'block' }
  | { kind: 'lines'; lines: string[] }
  | { kind: 'single'; latex: string }

const BLOCK_MATH = /\\\[([\s\S]*?)\\\]/g
const INLINE_MATH = /\\\(([\s\S]*?)\\\)/g
const LABELLED_PARAGRAPH = /^(Ejercicio|Pista|Resultado final):\s*(.*)$/i

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
}

const SYMBOL_TO_LATEX: Array<[string, string]> = [
  ['∫', '\\int '],
  ['∂', '\\partial '],
  ['∑', '\\sum '],
  ['∏', '\\prod '],
  ['π', '\\pi '],
  ['∞', '\\infty'],
  ['→', '\\to '],
  ['×', '\\times '],
  ['÷', '\\div '],
  ['±', '\\pm '],
  ['∓', '\\mp '],
  ['≤', '\\leq '],
  ['≥', '\\geq '],
  ['≠', '\\neq '],
  ['≈', '\\approx '],
  ['·', '\\cdot '],
  ['α', '\\alpha '],
  ['β', '\\beta '],
  ['γ', '\\gamma '],
  ['Γ', '\\Gamma '],
  ['δ', '\\delta '],
  ['Δ', '\\Delta '],
  ['ε', '\\epsilon '],
  ['θ', '\\theta '],
  ['λ', '\\lambda '],
  ['μ', '\\mu '],
  ['ν', '\\nu '],
  ['σ', '\\sigma '],
  ['Σ', '\\Sigma '],
  ['φ', '\\phi '],
  ['Φ', '\\Phi '],
  ['ω', '\\omega '],
  ['Ω', '\\Omega '],
  ['ρ', '\\rho '],
  ['τ', '\\tau '],
]

// Characters and commands that make a line look like math when typing in the composer.
const COMPOSER_MATH_SIGNAL = /[=^+\-/*()∫√π∂∑∏²³⁴⁵⁶⁷⁸⁹αβγδθλμσφω]|\\(?:int|frac|sqrt|sin|cos|tan|lim)/
const PREVIEW_CANDIDATE_SIGNAL = /[=^+\-/*()∫√π]|\\(?:int|frac|sqrt|sin|cos|tan|lim)/
const PARAGRAPH_MATH_SIGNAL = /[=^+\-/*()]|(?:\b(?:sin|cos|tan|lim|sqrt|integral)\b)/i
const MATH_WORDS = /^(sin|sen|cos|tan|ln|log|exp|pi|lim|sqrt|integral|dx|dy|dz|dt)$/i

export function splitBlockMath(content: string): MathSegment[] {
  const segments: MathSegment[] = []
  let lastIndex = 0

  for (const match of content.matchAll(BLOCK_MATH)) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', content: content.slice(lastIndex, match.index) })
    }
    segments.push({ kind: 'block', content: match[1].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    segments.push({ kind: 'text', content: content.slice(lastIndex) })
  }

  return segments.filter((segment) => segment.content.trim().length > 0)
}

export function splitInlineMath(text: string): InlineSegment[] {
  const segments: InlineSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(INLINE_MATH)) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', content: text.slice(lastIndex, match.index) })
    }
    segments.push({ kind: 'math', content: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ kind: 'text', content: text.slice(lastIndex) })
  }

  return segments
}

export function sanitizeParagraph(paragraph: string): string {
  const trimmed = paragraph.trim()
  if (!trimmed || /^(undefined|null)$/i.test(trimmed)) {
    return ''
  }
  return trimmed
}

export function parseLabelledParagraph(paragraph: string): { label: string; rest: string } | null {
  const match = paragraph.match(LABELLED_PARAGRAPH)
  return match ? { label: match[1], rest: match[2] } : null
}

export function looksLikeLatex(text: string): boolean {
  return /\\(?:frac|int|lim|sqrt|sin|cos|tan|pi|to|left|right)/.test(text)
}

function isNarrativeSentence(text: string): boolean {
  const wordCount = text.split(/\s+/).length
  const endsLikeSentence = /[.!?]$/.test(text)
  const longWords = text.match(/[A-Za-zÁÉÍÓÚáéíóúñÑ]{3,}/g) ?? []
  return wordCount > 8 || endsLikeSentence || longWords.length > 3
}

export function shouldRenderStandaloneMath(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || isNarrativeSentence(trimmed)) {
    return false
  }
  if (looksLikeLatex(trimmed) && trimmed.split(/\s+/).length <= 12) {
    return true
  }

  // Single letters are variables, not words; any other non-math word means prose.
  const wordCount = trimmed.split(/\s+/).length
  const words = (trimmed.match(/[A-Za-zÁÉÍÓÚáéíóúñÑ]{2,}/g) ?? []).filter((word) => !MATH_WORDS.test(word))
  return PARAGRAPH_MATH_SIGNAL.test(trimmed) && wordCount <= 8 && words.length === 0
}

function normalizePlainExpression(expression: string): string {
  let value = expression

  for (const [symbol, digit] of Object.entries(SUPERSCRIPT_DIGITS)) {
    value = value.replaceAll(symbol, `^${digit}`)
  }
  for (const [symbol, latex] of SYMBOL_TO_LATEX) {
    value = value.replaceAll(symbol, latex)
  }

  // A backslash before a word means it is already a LaTeX command, so the word rules skip it.
  return value
    .replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/√/g, '\\sqrt ')
    .replace(/\*\*/g, '^')
    .replace(/(?<!\\)\bpi\b/g, '\\pi')
    .replace(/(?<!\\)\bsen\b/g, '\\sin')
    .replace(/(?<!\\)\b(sin|cos|tan|ln|log)\b/g, '\\$1')
    .replace(/(?<!\\)\bsqrt\(([^()]+)\)/g, '\\sqrt{$1}')
    .replace(/(?<!\\)\bexp\(([^()]+)\)/g, 'e^{$1}')
    .replace(/->/g, '\\to ')
    .replace(/\*/g, ' ')
}

export function plainMathToLatex(input: string): string {
  const value = input.trim()
  if (!value) {
    return ''
  }

  if (looksLikeLatex(value)) {
    return value
  }

  const integral = value.match(/^(?:integral|∫)\s+(.+?)\s+d([a-zA-Z])$/i)
  if (integral) {
    const [, integrand, variable] = integral
    return `\\int ${normalizePlainExpression(integrand)}\\, d${variable}`
  }

  const derivative = value.match(/^d\/d([a-zA-Z])\s*\((.+)\)$/i)
  if (derivative) {
    const [, variable, expression] = derivative
    return `\\frac{d}{d${variable}}\\left(${normalizePlainExpression(expression)}\\right)`
  }

  const limit = value.match(/^lim\s+([a-zA-Z])\s*->\s*([^\s]+)\s+(.+)$/i)
  if (limit) {
    const [, variable, point, expression] = limit
    return `\\lim_{${variable} \\to ${point}} ${normalizePlainExpression(expression)}`
  }

  return normalizePlainExpression(value)
}

export function extractMathCandidateForPreview(content: string): string | null {
  const lines = content
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (PREVIEW_CANDIDATE_SIGNAL.test(lines[index])) {
      return lines[index]
    }
  }

  return null
}

export function getMathPreview(message: string): MathPreview {
  const mathLines = message
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && COMPOSER_MATH_SIGNAL.test(line))

  if (mathLines.length > 1) {
    return { kind: 'lines', lines: mathLines }
  }

  if (/\\\[[\s\S]*?\\\]/.test(message)) {
    return { kind: 'block' }
  }

  const candidate = extractMathCandidateForPreview(message)
  const latex = candidate ? plainMathToLatex(candidate) : ''

  return latex ? { kind: 'single', latex } : { kind: 'none' }
}
