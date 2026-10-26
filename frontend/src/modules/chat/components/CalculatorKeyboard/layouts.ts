// The keys of each calculator tab, as data. What every key writes is documented in
// openspec/specs/calculator-keyboard/spec.md; `|` in a written template marks where the cursor goes.

export type TabId = 'numeric' | 'functions' | 'letters' | 'symbols'
export type AlphaLayoutId = 'latin' | 'greek'
export type LayoutId = Exclude<TabId, 'letters'> | AlphaLayoutId

export type IconName = 'backspace' | 'left' | 'right' | 'enter' | 'shift'

export type KeyAction =
  | { kind: 'text'; text: string; caret: number }
  | { kind: 'letter'; lower: string; upper: string }
  | { kind: 'backspace' }
  | { kind: 'move'; by: -1 | 1 }
  | { kind: 'shift' }
  | { kind: 'accent' }
  | { kind: 'layout'; to: AlphaLayoutId }

export interface KeyDef {
  id: string
  // Visible text. KaTeX source in `math` takes its place when present; `icon` replaces both.
  label?: string
  math?: string
  icon?: IconName
  // Spanish accessible name.
  name: string
  action: KeyAction
  // Relative width inside its row.
  weight?: number
  tone?: 'control'
}

// An empty cell that keeps the grid aligned with the GeoGebra screenshots.
export interface Spacer {
  id: string
  spacer: true
  weight?: number
}

export type Key = KeyDef | Spacer
export type Row = Key[]

export interface Block {
  rows: Row[]
}

export interface Layout {
  blocks: Block[]
}

export const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'numeric', label: '123' },
  { id: 'functions', label: 'f(x)' },
  { id: 'letters', label: 'ABC' },
  { id: 'symbols', label: '#&¬' },
]

export function isSpacer(key: Key): key is Spacer {
  return 'spacer' in key
}

type KeyOptions = Partial<Pick<KeyDef, 'math' | 'icon' | 'weight' | 'tone'>>

function parseTemplate(written: string): { text: string; caret: number } {
  const caret = written.indexOf('|')
  return caret === -1 ? { text: written, caret: written.length } : { text: written.replace('|', ''), caret }
}

// A key that writes `written`; a `|` in it marks where the cursor ends up.
function write(id: string, label: string, name: string, written: string, options: KeyOptions = {}): KeyDef {
  return { id, label, name, action: { kind: 'text', ...parseTemplate(written) }, ...options }
}

// A key that writes exactly what it shows, named after its own character.
function plain(character: string, name: string = character, options: KeyOptions = {}): KeyDef {
  return write(`key-${name}`, character, name, character, options)
}

// A key drawn from KaTeX source (with empty boxes for its slots) that writes a template.
function template(id: string, math: string, name: string, written: string): KeyDef {
  return { id, math, name, action: { kind: 'text', ...parseTemplate(written) } }
}

function letter(lower: string, upper: string = lower.toUpperCase(), options: KeyOptions = {}): KeyDef {
  return { id: `letter-${lower}`, label: lower, name: lower, action: { kind: 'letter', lower, upper }, ...options }
}

const backspace: KeyDef = {
  id: 'backspace',
  icon: 'backspace',
  name: 'Retroceso',
  action: { kind: 'backspace' },
  tone: 'control',
}
const cursorLeft: KeyDef = {
  id: 'cursor-left',
  icon: 'left',
  name: 'Cursor a la izquierda',
  action: { kind: 'move', by: -1 },
  tone: 'control',
}
const cursorRight: KeyDef = {
  id: 'cursor-right',
  icon: 'right',
  name: 'Cursor a la derecha',
  action: { kind: 'move', by: 1 },
  tone: 'control',
}
const lineBreak: KeyDef = {
  id: 'line-break',
  icon: 'enter',
  name: 'Salto de línea',
  action: { kind: 'text', text: '\n', caret: 1 },
  tone: 'control',
}

const numeric: Layout = {
  blocks: [
    {
      rows: [
        [
          { ...plain('x', 'Variable x'), math: 'x' },
          { ...plain('y', 'Variable y'), math: 'y' },
          { ...plain('π', 'Número pi'), math: String.raw`\pi` },
          { ...plain('e', 'Número e'), math: 'e' },
        ],
        [
          template('squared', String.raw`\square^{2}`, 'Al cuadrado', '^2'),
          template('power', String.raw`\square^{\square}`, 'Potencia', '^(|)'),
          template('sqrt', String.raw`\sqrt{\square}`, 'Raíz cuadrada', 'sqrt(|)'),
          template('abs', String.raw`\left|\square\right|`, 'Valor absoluto', 'abs(|)'),
        ],
        [
          plain('<', 'Menor que'),
          plain('>', 'Mayor que'),
          template('fraction', String.raw`\frac{\square}{\square}`, 'Fracción', '(|)/()'),
          template('index', String.raw`\square_{\square}^{\square}`, 'Subíndice y superíndice', '_(|)^()'),
        ],
        [{ id: 'ans-gap', spacer: true }, plain(',', 'Coma'), plain('(', 'Abrir paréntesis'), plain(')', 'Cerrar paréntesis')],
      ],
    },
    {
      rows: [
        [plain('7'), plain('8'), plain('9'), plain('×', 'Multiplicar'), plain('÷', 'Dividir')],
        [plain('4'), plain('5'), plain('6'), plain('+', 'Sumar'), write('key-minus', '−', 'Restar', '-')],
        [plain('1'), plain('2'), plain('3'), plain('=', 'Igual'), backspace],
        [plain('0'), plain('.', 'Punto decimal'), cursorLeft, cursorRight, lineBreak],
      ],
    },
  ],
}

const functions: Layout = {
  blocks: [
    {
      rows: [
        [
          write('sin', 'sen', 'Seno', 'sen(|)'),
          write('cos', 'cos', 'Coseno', 'cos(|)'),
          write('tan', 'tg', 'Tangente', 'tg(|)'),
        ],
        [
          write('arcsin', 'sen⁻¹', 'Arcoseno', 'arcsen(|)'),
          write('arccos', 'cos⁻¹', 'Arcocoseno', 'arccos(|)'),
          write('arctan', 'tg⁻¹', 'Arcotangente', 'arctg(|)'),
        ],
        [
          write('ln', 'ln', 'Logaritmo natural', 'ln(|)'),
          write('log10', 'log₁₀', 'Logaritmo base 10', 'log10(|)'),
          template('log-base', String.raw`\log_{\square}`, 'Logaritmo con base', 'log_(|)()'),
        ],
        [
          template('exp-e', String.raw`e^{\square}`, 'e elevado a', 'e^(|)'),
          template('exp-10', String.raw`10^{\square}`, '10 elevado a', '10^(|)'),
          template('nth-root', String.raw`\sqrt[\square]{\square}`, 'Raíz n-ésima', 'root(|,)'),
        ],
      ],
    },
    {
      rows: [
        [plain('%', 'Porcentaje'), plain('!', 'Factorial'), plain('$', 'Signo de dólar'), plain('°', 'Grado')],
        [plain('{', 'Abrir llave'), plain('}', 'Cerrar llave'), plain('≤', 'Menor o igual'), plain('≥', 'Mayor o igual')],
        [
          template('derivative', String.raw`\frac{d}{dx}`, 'Derivada', 'd/dx(|)'),
          template('integral', String.raw`\int`, 'Integral', '∫ | dx'),
          { ...plain('i', 'Unidad imaginaria'), math: 'i' },
          backspace,
        ],
        [template('subscript', String.raw`\square_{\square}`, 'Subíndice', '_(|)'), cursorLeft, cursorRight, lineBreak],
      ],
    },
  ],
}

const shift: KeyDef = {
  id: 'shift',
  icon: 'shift',
  name: 'Mayúscula',
  action: { kind: 'shift' },
  tone: 'control',
}

const accent: KeyDef = {
  id: 'accent',
  label: '´',
  name: 'Acento agudo',
  action: { kind: 'accent' },
  tone: 'control',
}

function switchKey(to: AlphaLayoutId): KeyDef {
  return {
    id: 'switch-layout',
    label: to === 'greek' ? 'αβγ' : 'ABC',
    name: to === 'greek' ? 'Letras griegas' : 'Letras latinas',
    action: { kind: 'layout', to },
    tone: 'control',
    weight: 1.5,
  }
}

const space: KeyDef = {
  id: 'space',
  name: 'Espacio',
  action: { kind: 'text', text: ' ', caret: 1 },
  weight: 2.5,
}

// Every row of a letter layout adds up to the same width (11) so its columns line up. It is the
// narrowest total that still leaves keys of 24 px or more in the ~280 px panel of a 360 px phone.
export const LETTER_ROW_WIDTH = 11
function bottomRow(to: AlphaLayoutId): Row {
  return [
    switchKey(to),
    plain(',', 'Coma'),
    plain('(', 'Abrir paréntesis'),
    plain(')', 'Cerrar paréntesis'),
    space,
    { ...cursorLeft, weight: 1.25 },
    { ...cursorRight, weight: 1.25 },
    { ...lineBreak, weight: 1.5 },
  ]
}

const latin: Layout = {
  blocks: [
    {
      rows: [
        [...[...'qwertyuiop'].map((character) => letter(character)), accent],
        [
          { id: 'gap-left', spacer: true, weight: 0.5 },
          ...[...'asdfghjkl'].map((character) => letter(character)),
          letter('ñ', 'Ñ'),
          { id: 'gap-right', spacer: true, weight: 0.5 },
        ],
        [
          shift,
          ...[...'zxcvbnm'].map((character) => letter(character)),
          letter('ï', 'Ï'),
          letter('ü', 'Ü'),
          backspace,
        ],
        bottomRow('greek'),
      ],
    },
  ],
}

// [lowercase, capital]; both phi forms share the capital Φ and the final sigma shares Σ.
const greekRows: Array<Array<[string, string]>> = [
  [['ϕ', 'Φ'], ['ς', 'Σ'], ['ε', 'Ε'], ['ρ', 'Ρ'], ['τ', 'Τ'], ['υ', 'Υ'], ['θ', 'Θ'], ['ι', 'Ι'], ['ο', 'Ο'], ['π', 'Π']],
  [['α', 'Α'], ['σ', 'Σ'], ['δ', 'Δ'], ['φ', 'Φ'], ['γ', 'Γ'], ['η', 'Η'], ['ξ', 'Ξ'], ['κ', 'Κ'], ['λ', 'Λ']],
  [['ζ', 'Ζ'], ['χ', 'Χ'], ['ψ', 'Ψ'], ['ω', 'Ω'], ['β', 'Β'], ['ν', 'Ν'], ['μ', 'Μ']],
]

const GREEK_WEIGHT = LETTER_ROW_WIDTH / 10

function greekKeys(row: Array<[string, string]>): Key[] {
  return row.map(([lower, upper]) => letter(lower, upper, { weight: GREEK_WEIGHT }))
}

const greek: Layout = {
  blocks: [
    {
      rows: [
        greekKeys(greekRows[0]),
        [
          { id: 'gap-left', spacer: true, weight: GREEK_WEIGHT / 2 },
          ...greekKeys(greekRows[1]),
          { id: 'gap-right', spacer: true, weight: GREEK_WEIGHT / 2 },
        ],
        [
          { ...shift, weight: GREEK_WEIGHT * 1.5 },
          ...greekKeys(greekRows[2]),
          { ...backspace, weight: GREEK_WEIGHT * 1.5 },
        ],
        bottomRow('latin'),
      ],
    },
  ],
}

const symbols: Layout = {
  blocks: [
    {
      rows: [
        [
          plain('∞', 'Infinito'),
          plain('≟', 'Comparar igualdad'),
          plain('≠', 'Distinto'),
          plain('∧', 'Y lógico'),
          plain('∨', 'O lógico'),
          plain('¬', 'Negación'),
          plain('⊗', 'Producto tensorial'),
          plain('[', 'Abrir corchete'),
          plain(']', 'Cerrar corchete'),
        ],
        [
          plain('∥', 'Paralelo'),
          plain('⊥', 'Perpendicular'),
          plain('∈', 'Pertenece'),
          plain('⊂', 'Subconjunto'),
          plain('⊆', 'Subconjunto o igual'),
          plain('∠', 'Ángulo'),
          plain('→', 'Flecha derecha'),
          template('ceiling', String.raw`\lceil\square\rceil`, 'Techo', 'ceil(|)'),
          template('floor', String.raw`\lfloor\square\rfloor`, 'Piso', 'floor(|)'),
        ],
        [
          template('point', String.raw`(\cdot,\cdot)`, 'Punto', '(|,)'),
          template('vector', String.raw`(\vdots)`, 'Vector columna', '(|;)'),
          template('matrix', String.raw`\left(\begin{smallmatrix}\cdot&\cdot\\\cdot&\cdot\end{smallmatrix}\right)`, 'Matriz', '{{|,},{,}}'),
          plain('\\', 'Barra invertida'),
          plain('&', 'Ampersand'),
          plain('@', 'Arroba'),
          plain('#', 'Numeral'),
          plain('$', 'Dólar'),
          backspace,
        ],
        [
          plain(';', 'Punto y coma'),
          plain(':', 'Dos puntos'),
          plain("'", 'Apóstrofo'),
          plain('"', 'Comillas'),
          plain('′', 'Prima'),
          plain('″', 'Doble prima'),
          cursorLeft,
          cursorRight,
          lineBreak,
        ],
      ],
    },
  ],
}

export const layouts: Record<LayoutId, Layout> = { numeric, functions, latin, greek, symbols }

// The layout shown for a tab: the "ABC" tab switches between the Latin and the Greek one.
export function layoutFor(tab: TabId, alpha: AlphaLayoutId): Layout {
  return tab === 'letters' ? layouts[alpha] : layouts[tab]
}
