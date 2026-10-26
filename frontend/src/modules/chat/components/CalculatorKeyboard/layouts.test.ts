import katex from 'katex'
import { describe, expect, it } from 'vitest'

import { LETTER_ROW_WIDTH, isSpacer, layoutFor, layouts, tabs } from './layouts'
import type { KeyDef, Layout, LayoutId } from './layouts'

function keysOf(layout: Layout): KeyDef[] {
  return layout.blocks.flatMap((block) => block.rows.flat()).filter((key): key is KeyDef => !isSpacer(key))
}

function rowSizes(layout: Layout): number[][] {
  return layout.blocks.map((block) => block.rows.map((row) => row.filter((key) => !isSpacer(key)).length))
}

function rowWeights(layout: Layout): number[][] {
  return layout.blocks.map((block) =>
    block.rows.map((row) => Number(row.reduce((sum, key) => sum + (key.weight ?? 1), 0).toFixed(3))),
  )
}

const layoutIds = Object.keys(layouts) as LayoutId[]

describe('tabs', () => {
  it('has the four tabs in order', () => {
    expect(tabs.map((tab) => tab.label)).toEqual(['123', 'f(x)', 'ABC', '#&¬'])
  })

  it('shows the Latin or the Greek layout on the ABC tab and one fixed layout on the others', () => {
    expect(layoutFor('letters', 'latin')).toBe(layouts.latin)
    expect(layoutFor('letters', 'greek')).toBe(layouts.greek)
    expect(layoutFor('numeric', 'greek')).toBe(layouts.numeric)
    expect(layoutFor('functions', 'latin')).toBe(layouts.functions)
    expect(layoutFor('symbols', 'greek')).toBe(layouts.symbols)
  })
})

describe('layout shape', () => {
  it('keeps the number of keys per row of the GeoGebra screens', () => {
    expect(rowSizes(layouts.numeric)).toEqual([[4, 4, 4, 3], [5, 5, 5, 5]])
    expect(rowSizes(layouts.functions)).toEqual([[3, 3, 3, 3], [4, 4, 4, 4]])
    expect(rowSizes(layouts.latin)).toEqual([[11, 10, 11, 8]])
    expect(rowSizes(layouts.greek)).toEqual([[10, 9, 9, 8]])
    expect(rowSizes(layouts.symbols)).toEqual([[9, 9, 9, 9]])
  })

  it('keeps the bottom-left cell of the numeric tab empty instead of a key', () => {
    const [firstBlock] = layouts.numeric.blocks
    expect(firstBlock.rows[3].filter(isSpacer)).toHaveLength(1)
    expect(firstBlock.rows[3].every((key) => isSpacer(key) || key.name !== 'ans')).toBe(true)
  })

  it('makes every row of a letter layout the same width so the columns line up', () => {
    expect(new Set(rowWeights(layouts.latin)[0])).toEqual(new Set([LETTER_ROW_WIDTH]))
    expect(new Set(rowWeights(layouts.greek)[0])).toEqual(new Set([LETTER_ROW_WIDTH]))
  })

  it.each(layoutIds)('has unique ids and unique accessible names in the %s layout', (id) => {
    const keys = keysOf(layouts[id])
    const ids = keys.map((key) => key.id)
    const names = keys.map((key) => key.name)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(names).size).toBe(names.length)
    expect(names.every((name) => name.trim().length > 0)).toBe(true)
  })

  it.each(layoutIds)('gives every key in the %s layout something to show', (id) => {
    for (const key of keysOf(layouts[id])) {
      const hasFace = Boolean(key.label ?? key.math ?? key.icon) || key.id === 'space'
      expect(hasFace, key.id).toBe(true)
    }
  })

  it('renders every KaTeX label without an error', () => {
    const labels = layoutIds.flatMap((id) => keysOf(layouts[id])).flatMap((key) => (key.math ? [key.math] : []))

    expect(labels.length).toBeGreaterThan(20)
    for (const label of labels) {
      expect(() => katex.renderToString(label, { throwOnError: true, strict: 'ignore' }), label).not.toThrow()
    }
  })
})

type Written = [name: string, text: string, caret: number]

// What each key writes and where the cursor goes (the table in design.md; `|` marks the cursor).
const writtenByLayout: Record<'numeric' | 'functions' | 'symbols', string[][]> = {
  numeric: [
    ['Variable x', 'x'],
    ['Variable y', 'y'],
    ['Número pi', 'π'],
    ['Número e', 'e'],
    ['Al cuadrado', '^2'],
    ['Potencia', '^(|)'],
    ['Raíz cuadrada', 'sqrt(|)'],
    ['Valor absoluto', 'abs(|)'],
    ['Menor que', '<'],
    ['Mayor que', '>'],
    ['Fracción', '(|)/()'],
    ['Subíndice y superíndice', '_(|)^()'],
    ['Coma', ','],
    ['Abrir paréntesis', '('],
    ['Cerrar paréntesis', ')'],
    ['7', '7'],
    ['8', '8'],
    ['9', '9'],
    ['4', '4'],
    ['5', '5'],
    ['6', '6'],
    ['1', '1'],
    ['2', '2'],
    ['3', '3'],
    ['0', '0'],
    ['Punto decimal', '.'],
    ['Multiplicar', '×'],
    ['Dividir', '÷'],
    ['Sumar', '+'],
    ['Restar', '-'],
    ['Igual', '='],
  ],
  functions: [
    ['Seno', 'sen(|)'],
    ['Coseno', 'cos(|)'],
    ['Tangente', 'tg(|)'],
    ['Arcoseno', 'arcsen(|)'],
    ['Arcocoseno', 'arccos(|)'],
    ['Arcotangente', 'arctg(|)'],
    ['Logaritmo natural', 'ln(|)'],
    ['Logaritmo base 10', 'log10(|)'],
    ['Logaritmo con base', 'log_(|)()'],
    ['e elevado a', 'e^(|)'],
    ['10 elevado a', '10^(|)'],
    ['Raíz n-ésima', 'root(|,)'],
    ['Porcentaje', '%'],
    ['Factorial', '!'],
    ['Signo de dólar', '$'],
    ['Grado', '°'],
    ['Abrir llave', '{'],
    ['Cerrar llave', '}'],
    ['Menor o igual', '≤'],
    ['Mayor o igual', '≥'],
    ['Derivada', 'd/dx(|)'],
    ['Integral', '∫ | dx'],
    ['Unidad imaginaria', 'i'],
    ['Subíndice', '_(|)'],
  ],
  symbols: [
    ['Infinito', '∞'],
    ['Comparar igualdad', '≟'],
    ['Distinto', '≠'],
    ['Y lógico', '∧'],
    ['O lógico', '∨'],
    ['Negación', '¬'],
    ['Producto tensorial', '⊗'],
    ['Abrir corchete', '['],
    ['Cerrar corchete', ']'],
    ['Paralelo', '∥'],
    ['Perpendicular', '⊥'],
    ['Pertenece', '∈'],
    ['Subconjunto', '⊂'],
    ['Subconjunto o igual', '⊆'],
    ['Ángulo', '∠'],
    ['Flecha derecha', '→'],
    ['Techo', 'ceil(|)'],
    ['Piso', 'floor(|)'],
    ['Punto', '(|,)'],
    ['Vector columna', '(|;)'],
    ['Matriz', '{{|,},{,}}'],
    ['Barra invertida', '\\'],
    ['Ampersand', '&'],
    ['Arroba', '@'],
    ['Numeral', '#'],
    ['Dólar', '$'],
    ['Punto y coma', ';'],
    ['Dos puntos', ':'],
    ['Apóstrofo', "'"],
    ['Comillas', '"'],
    ['Prima', '′'],
    ['Doble prima', '″'],
  ],
}

function expectedWrites(rows: string[][]): Written[] {
  return rows.map(([name, template]) => {
    const caret = template.indexOf('|')
    return caret === -1 ? [name, template, template.length] : [name, template.replace('|', ''), caret]
  })
}

describe('what each key writes', () => {
  for (const id of ['numeric', 'functions', 'symbols'] as const) {
    it.each(expectedWrites(writtenByLayout[id]))(`${id}: "%s" writes %j with the cursor at %i`, (name, text, caret) => {
      const key = keysOf(layouts[id]).find((candidate) => candidate.name === name)

      expect(key?.action).toEqual({ kind: 'text', text, caret })
    })
  }

  it('lists every writing key of the numeric, function and symbol layouts', () => {
    for (const id of ['numeric', 'functions', 'symbols'] as const) {
      const writing = keysOf(layouts[id]).filter((key) => key.action.kind === 'text' && key.id !== 'line-break')
      expect(writing.map((key) => key.name).sort()).toEqual(writtenByLayout[id].map(([name]) => name).sort())
    }
  })

  it('writes a line break with the line break key and a space with the space bar', () => {
    for (const id of ['numeric', 'functions', 'latin', 'greek', 'symbols'] as const) {
      const lineBreak = keysOf(layouts[id]).find((key) => key.name === 'Salto de línea')
      expect(lineBreak?.action).toEqual({ kind: 'text', text: '\n', caret: 1 })
    }
    expect(keysOf(layouts.latin).find((key) => key.name === 'Espacio')?.action).toEqual({
      kind: 'text',
      text: ' ',
      caret: 1,
    })
  })

  it('has the control keys on every layout that the spec lists', () => {
    const controls = (id: LayoutId) => keysOf(layouts[id]).map((key) => key.action.kind)

    for (const id of layoutIds) {
      expect(controls(id)).toContain('backspace')
      expect(controls(id)).toContain('move')
    }
    expect(controls('latin')).toEqual(expect.arrayContaining(['shift', 'accent', 'layout']))
    expect(controls('greek')).toEqual(expect.arrayContaining(['shift', 'layout']))
    expect(controls('greek')).not.toContain('accent')
  })
})

describe('letter layouts', () => {
  const latinLetters = (rowIndex: number) =>
    layouts.latin.blocks[0].rows[rowIndex].filter((key): key is KeyDef => !isSpacer(key) && key.action.kind === 'letter')

  it('has the Latin rows of the screenshot', () => {
    expect(latinLetters(0).map((key) => key.label).join('')).toBe('qwertyuiop')
    expect(latinLetters(1).map((key) => key.label).join('')).toBe('asdfghjklñ')
    expect(latinLetters(2).map((key) => key.label).join('')).toBe('zxcvbnmïü')
  })

  it('gives each Latin letter its capital form', () => {
    const letters = keysOf(layouts.latin).flatMap((key) => (key.action.kind === 'letter' ? [key.action] : []))

    expect(letters).toHaveLength(29)
    for (const action of letters) {
      expect(action.upper).toBe(action.lower.toUpperCase())
    }
  })

  it('has the Greek rows of the screenshot with a capital for every letter', () => {
    const rows = [0, 1, 2].map((index) =>
      layouts.greek.blocks[0].rows[index]
        .filter((key): key is KeyDef => !isSpacer(key) && key.action.kind === 'letter')
        .map((key) => key.label)
        .join(''),
    )

    expect(rows).toEqual(['ϕςερτυθιοπ', 'ασδφγηξκλ', 'ζχψωβνμ'])
    for (const key of keysOf(layouts.greek)) {
      if (key.action.kind === 'letter') {
        expect(key.action.upper).not.toBe(key.action.lower)
      }
    }
  })

  it('keeps the two phi letters and the final sigma as different keys', () => {
    const actions = keysOf(layouts.greek).flatMap((key) => (key.action.kind === 'letter' ? [key.action] : []))
    const lowers = actions.map((action) => action.lower)

    expect(lowers).toContain('ϕ')
    expect(lowers).toContain('φ')
    expect(lowers).toContain('ς')
    expect(lowers).toContain('σ')
    expect(new Set(lowers).size).toBe(lowers.length)
  })

  it('switches between the Latin and the Greek layout with the key in the last row', () => {
    const toGreek = keysOf(layouts.latin).find((key) => key.action.kind === 'layout')
    const toLatin = keysOf(layouts.greek).find((key) => key.action.kind === 'layout')

    expect(toGreek).toMatchObject({ label: 'αβγ', action: { kind: 'layout', to: 'greek' } })
    expect(toLatin).toMatchObject({ label: 'ABC', action: { kind: 'layout', to: 'latin' } })
  })
})
