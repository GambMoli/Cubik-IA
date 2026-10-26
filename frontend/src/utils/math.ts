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
  ['ζ', '\\zeta '],
  ['η', '\\eta '],
  ['ι', '\\iota '],
  ['κ', '\\kappa '],
  ['ξ', '\\xi '],
  ['ο', 'o'],
  ['υ', '\\upsilon '],
  ['χ', '\\chi '],
  ['ψ', '\\psi '],
  ['ς', '\\varsigma '],
  ['ϕ', '\\varphi '],
  ['Θ', '\\Theta '],
  ['Λ', '\\Lambda '],
  ['Ξ', '\\Xi '],
  ['Π', '\\Pi '],
  ['Υ', '\\Upsilon '],
  ['Ψ', '\\Psi '],
  // Capitals that look the same as a Latin letter.
  ['Α', 'A'],
  ['Β', 'B'],
  ['Ε', 'E'],
  ['Ζ', 'Z'],
  ['Η', 'H'],
  ['Ι', 'I'],
  ['Κ', 'K'],
  ['Μ', 'M'],
  ['Ν', 'N'],
  ['Ο', 'O'],
  ['Ρ', 'P'],
  ['Τ', 'T'],
  ['Χ', 'X'],
  ['∧', '\\land '],
  ['∨', '\\lor '],
  ['¬', '\\neg '],
  ['⊗', '\\otimes '],
  ['∈', '\\in '],
  ['⊂', '\\subset '],
  ['⊆', '\\subseteq '],
  ['∠', '\\angle '],
  ['⊥', '\\perp '],
  ['∥', '\\parallel '],
  ['≟', '\\stackrel{?}{=}'],
  // An empty base keeps these from clashing with a superscript already on the previous term (x^2°).
  ['°', '{}^{\\circ}'],
  ['′', '{}^{\\prime}'],
  ['″', '{}^{\\prime\\prime}'],
]

// Characters and commands that make a line look like math when typing in the composer. The range
// Ͱ-Ͽ is the Greek block, so every letter the calculator can write counts.
const COMPOSER_MATH_SIGNAL =
  /[=^+\-/*()_<>∫√∂∑∏²³⁴⁵⁶⁷⁸⁹×÷≤≥≠≈±∞∈⊂⊆∧∨¬⊗⊥∥∠→°Ͱ-Ͽ]|\\(?:int|frac|sqrt|sin|cos|tan|lim)/
const PREVIEW_CANDIDATE_SIGNAL =
  /[=^+\-/*()_<>∫√×÷≤≥≠≈±∞∈⊂⊆∧∨¬⊗⊥∥∠→°Ͱ-Ͽ]|\\(?:int|frac|sqrt|sin|cos|tan|lim)/

// A backslash command or a ^{ / _{ group means the braces are LaTeX the user wrote, not a set.
const LATEX_BRACES = /\\[A-Za-z]+|[\^_]\{/
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

const CALL_START = /^(sqrt|abs|root|ceil|floor|exp)\(/

// Index of the ")" that closes the "(" at `open`, or -1 when it is never closed.
function findClosingParenthesis(text: string, open: number): number {
  let depth = 0
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '(') {
      depth += 1
    } else if (text[index] === ')') {
      depth -= 1
      if (depth === 0) {
        return index
      }
    }
  }
  return -1
}

// Splits on the commas that are not inside parentheses.
function splitTopLevel(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '(') {
      depth += 1
    } else if (text[index] === ')') {
      depth -= 1
    } else if (text[index] === ',' && depth === 0) {
      parts.push(text.slice(start, index))
      start = index + 1
    }
  }
  parts.push(text.slice(start))
  return parts
}

function renderCall(name: string, inner: string): string {
  const content = convertGroups(inner)

  switch (name) {
    case 'sqrt':
      return `\\sqrt{${content}}`
    case 'abs':
      return `\\left|${content}\\right|`
    case 'exp':
      return `e^{${content}}`
    case 'ceil':
      return `\\left\\lceil ${content}\\right\\rceil `
    case 'floor':
      return `\\left\\lfloor ${content}\\right\\rfloor `
    default: {
      // root(n, x) is the n-th root of x; anything else falls back to a square root.
      const [index, radicand, ...rest] = splitTopLevel(inner)
      return radicand !== undefined && rest.length === 0
        ? `\\sqrt[${convertGroups(index.trim())}]{${convertGroups(radicand.trim())}}`
        : `\\sqrt{${content}}`
    }
  }
}

// Rewrites the calls and groups that need matching parentheses: sqrt, abs, root, ceil, floor, exp,
// grouped exponents and subscripts such as ^(x+1) and _(n), and a parenthesized fraction (a)/(b).
function convertGroups(text: string): string {
  let output = ''
  let index = 0

  while (index < text.length) {
    const char = text[index]
    const previous = index > 0 ? text[index - 1] : ''

    const call = previous && /[A-Za-z0-9\\]/.test(previous) ? null : text.slice(index).match(CALL_START)
    if (call) {
      const open = index + call[1].length
      const close = findClosingParenthesis(text, open)
      if (close !== -1) {
        output += renderCall(call[1], text.slice(open + 1, close))
        index = close + 1
        continue
      }
    }

    if ((char === '^' || char === '_') && text[index + 1] === '(') {
      const close = findClosingParenthesis(text, index + 1)
      if (close !== -1) {
        output += `${char}{${convertGroups(text.slice(index + 2, close))}}`
        index = close + 1
        continue
      }
    }

    // (a)/(b) is a fraction, unless the first group is an argument (sin(x)/(2)) or a factor (2(x)/(y)).
    if (char === '(' && !/[A-Za-z0-9]/.test(previous)) {
      const closeNumerator = findClosingParenthesis(text, index)
      if (closeNumerator !== -1 && text[closeNumerator + 1] === '/' && text[closeNumerator + 2] === '(') {
        const closeDenominator = findClosingParenthesis(text, closeNumerator + 2)
        if (closeDenominator !== -1) {
          const numerator = text.slice(index + 1, closeNumerator)
          const denominator = text.slice(closeNumerator + 3, closeDenominator)
          output += `\\frac{${convertGroups(numerator)}}{${convertGroups(denominator)}}`
          index = closeDenominator + 1
          continue
        }
      }
    }

    output += char
    index += 1
  }

  return output
}

// Characters the calculator can write that mean something else to LaTeX: % starts a comment,
// $ # & are reserved, a lone backslash is a space, and unbalanced braces are a parse error.
function escapeLatexSpecials(text: string, keepBraces: boolean): string {
  const escaped = text
    .replace(/(?<!\\)\\(?![A-Za-z{}()[\]%$#&,;:!\\])/g, '\\backslash ')
    .replace(/(?<!\\)([%$#&])/g, '\\$1')

  return keepBraces ? escaped : escaped.replace(/(?<!\\)([{}])/g, '\\$1')
}

function normalizePlainExpression(expression: string): string {
  let value = escapeLatexSpecials(expression, LATEX_BRACES.test(expression))

  for (const [symbol, digit] of Object.entries(SUPERSCRIPT_DIGITS)) {
    value = value.replaceAll(symbol, `^${digit}`)
  }
  for (const [symbol, latex] of SYMBOL_TO_LATEX) {
    value = value.replaceAll(symbol, latex)
  }

  // A backslash before a word means it is already a LaTeX command, so the word rules skip it.
  return convertGroups(
    value
      .replace(/√\(([^)]+)\)/g, '\\sqrt{$1}')
      .replace(/√/g, '\\sqrt ')
      .replace(/\*\*/g, '^'),
  )
    .replace(/(?<!\\)\bpi\b/g, '\\pi')
    .replace(/(?<!\\)\bsen\b/g, '\\sin')
    .replace(/(?<!\\)\b(?:arcsen|arcsin)\b/g, '\\arcsin')
    .replace(/(?<!\\)\barccos\b/g, '\\arccos')
    .replace(/(?<!\\)\b(?:arctg|arctan)\b/g, '\\arctan')
    .replace(/(?<!\\)\btg\b/g, '\\tan')
    .replace(/(?<!\\)\blog10\b/g, '\\log_{10}')
    // log_(b)(x): the base was already grouped as log_{b}, so only the name is left to convert.
    .replace(/(?<![\\A-Za-z0-9_])log(?=_\{)/g, '\\log')
    .replace(/(?<!\\)\b(sin|cos|tan|ln|log)\b/g, '\\$1')
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
