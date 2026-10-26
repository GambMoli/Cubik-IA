import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '../../../../testUtils'
import { CalculatorKeyboard } from './CalculatorKeyboard'
import { applyEditCommand } from './keyboardState'
import type { EditCommand } from './keyboardState'
import { isSpacer, layoutFor, layouts, tabs } from './layouts'
import type { AlphaLayoutId, KeyDef, TabId } from './layouts'

type User = ReturnType<typeof userEvent.setup>

function newUser() {
  return userEvent.setup({ delay: null })
}

function namesOf(tab: TabId, alpha: AlphaLayoutId = 'latin'): string[] {
  return layoutFor(tab, alpha)
    .blocks.flatMap((block) => block.rows.flat())
    .filter((key): key is KeyDef => !isSpacer(key))
    .map((key) => key.name)
}

function getTab(label: string) {
  return screen.getByRole('tab', { name: label })
}

function getKey(name: string) {
  return within(screen.getByRole('tabpanel')).getByRole('button', { name })
}

describe('CalculatorKeyboard structure', () => {
  it('is a region named Calculadora with the four tabs, opening on 123', () => {
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    expect(screen.getByRole('region', { name: 'Calculadora' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['123', 'f(x)', 'ABC', '#&¬'])
    expect(getTab('123')).toHaveAttribute('aria-selected', 'true')
    for (const label of ['f(x)', 'ABC', '#&¬']) {
      expect(getTab(label)).toHaveAttribute('aria-selected', 'false')
    }
    expect(getKey('Raíz cuadrada')).toBeInTheDocument()
  })

  it('exposes the tabs in a tablist and links the selected tab to the key panel', () => {
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    expect(screen.getByRole('tablist')).toContainElement(getTab('123'))
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('123')
  })

  it('shows the keys of the numeric tab found by accessible name', () => {
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    const panelButtons = within(screen.getByRole('tabpanel')).getAllByRole('button')
    expect(panelButtons.map((button) => button.getAttribute('aria-label'))).toEqual(
      expect.arrayContaining(['Variable x', 'Número pi', 'Fracción', 'Valor absoluto', 'Multiplicar', 'Retroceso', '7', '0']),
    )
    expect(panelButtons).toHaveLength(namesOf('numeric').length)
  })

  it.each(tabs)('shows exactly the keys of the $label tab when it is selected', async ({ id, label }) => {
    const user = newUser()
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    await user.click(getTab(label))

    expect(getTab(label)).toHaveAttribute('aria-selected', 'true')
    const shown = within(screen.getByRole('tabpanel')).getAllByRole('button')
    expect(shown.map((button) => button.getAttribute('aria-label')).sort()).toEqual(namesOf(id).sort())
  })

  it('marks the previous tab as not selected and swaps the keys when the tab changes', async () => {
    const user = newUser()
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    await user.click(getTab('f(x)'))

    expect(getTab('f(x)')).toHaveAttribute('aria-selected', 'true')
    expect(getTab('123')).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByRole('button', { name: 'Raíz cuadrada' })).not.toBeInTheDocument()
    expect(getKey('Seno')).toBeInTheDocument()
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('f(x)')
  })

  it('shows the Greek layout under the same ABC tab and goes back to Latin', async () => {
    const user = newUser()
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    await user.click(getTab('ABC'))
    expect(getKey('q')).toBeInTheDocument()

    await user.click(getKey('Letras griegas'))
    expect(getTab('ABC')).toHaveAttribute('aria-selected', 'true')
    expect(getKey('ϕ')).toBeInTheDocument()
    expect(getKey('Letras latinas')).toHaveTextContent('ABC')
    expect(screen.queryByRole('button', { name: 'q' })).not.toBeInTheDocument()

    await user.click(getKey('Letras latinas'))
    expect(getKey('q')).toBeInTheDocument()
    expect(getKey('Letras griegas')).toHaveTextContent('αβγ')
  })

  it('opens the ABC tab on the Latin layout even after using Greek', async () => {
    const user = newUser()
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    await user.click(getTab('ABC'))
    await user.click(getKey('Letras griegas'))
    await user.click(getTab('123'))
    await user.click(getTab('ABC'))

    expect(getKey('q')).toBeInTheDocument()
  })

  it('names every key of every layout with the Spanish name from its definition', () => {
    for (const id of Object.keys(layouts) as Array<keyof typeof layouts>) {
      for (const key of layouts[id].blocks.flatMap((block) => block.rows.flat())) {
        if (!isSpacer(key)) {
          expect(key.name.length).toBeGreaterThan(0)
        }
      }
    }
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)
    expect(getKey('Retroceso')).toBeInTheDocument()
  })

  it('draws template keys with KaTeX but names them by their action, hiding the drawing', () => {
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    const sqrt = getKey('Raíz cuadrada')
    expect(sqrt.querySelector('.katex')).toBeInTheDocument()
    expect(sqrt.querySelector('.katex')?.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(sqrt).toHaveAccessibleName('Raíz cuadrada')
  })

  it('renders no button for the empty cell where GeoGebra has the ans key', () => {
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    expect(screen.queryByRole('button', { name: /ans/i })).not.toBeInTheDocument()
  })

  it('does not take the focus away from the input when a key is pressed with the mouse', () => {
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)

    // fireEvent returns false when the event's default action was prevented.
    expect(fireEvent.mouseDown(getKey('Variable x'))).toBe(false)
    expect(fireEvent.mouseDown(getTab('f(x)'))).toBe(false)
  })

  it('reports each writing key as an edit command, and says whether it came from a pointer', async () => {
    const user = newUser()
    const onEdit = vi.fn()
    renderWithTheme(<CalculatorKeyboard onEdit={onEdit} />)

    await user.click(getKey('Raíz cuadrada'))
    expect(onEdit).toHaveBeenLastCalledWith({ type: 'insert', text: 'sqrt()', caret: 5 }, { pointer: true })

    getKey('Variable y').focus()
    await user.keyboard('{Enter}')
    expect(onEdit).toHaveBeenLastCalledWith({ type: 'insert', text: 'y', caret: 1 }, { pointer: false })
    await user.keyboard(' ')
    expect(onEdit).toHaveBeenCalledTimes(3)
    expect(onEdit).toHaveBeenLastCalledWith({ type: 'insert', text: 'y', caret: 1 }, { pointer: false })
  })

  it('does not report an edit for the keys that only change the keyboard', async () => {
    const user = newUser()
    const onEdit = vi.fn()
    renderWithTheme(<CalculatorKeyboard onEdit={onEdit} />)

    await user.click(getTab('ABC'))
    await user.click(getKey('Mayúscula'))
    await user.click(getKey('Acento agudo'))
    await user.click(getKey('Letras griegas'))

    expect(onEdit).not.toHaveBeenCalled()
  })

  it('shows shift and accent as pressed while they are on and after they are used', async () => {
    const user = newUser()
    renderWithTheme(<CalculatorKeyboard onEdit={vi.fn()} />)
    await user.click(getTab('ABC'))

    expect(getKey('Mayúscula')).toHaveAttribute('aria-pressed', 'false')
    await user.click(getKey('Mayúscula'))
    await user.click(getKey('Acento agudo'))
    expect(getKey('Mayúscula')).toHaveAttribute('aria-pressed', 'true')
    expect(getKey('Acento agudo')).toHaveAttribute('aria-pressed', 'true')
    expect(getKey('q')).toHaveTextContent('Q')

    await user.click(getKey('q'))
    expect(getKey('Mayúscula')).toHaveAttribute('aria-pressed', 'false')
    expect(getKey('Acento agudo')).toHaveAttribute('aria-pressed', 'false')
    expect(getKey('q')).toHaveTextContent('q')
  })
})

// A text field driven by the keyboard the way the composer drives its input.
function Host({ initialValue = '', onChange }: { initialValue?: string; onChange?: (value: string) => void }) {
  const [value, setValue] = useState(initialValue)
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // As if the user had typed the initial text: the cursor starts after it.
  useEffect(() => {
    textareaRef.current?.setSelectionRange(initialValue.length, initialValue.length)
  }, [initialValue])

  useEffect(() => {
    if (selection) {
      textareaRef.current?.setSelectionRange(selection.start, selection.end)
    }
  }, [selection])

  function handleEdit(command: EditCommand) {
    const textarea = textareaRef.current
    const edit = applyEditCommand(command, value, textarea?.selectionStart ?? value.length, textarea?.selectionEnd ?? value.length)

    setValue(edit.value)
    setSelection({ start: edit.selectionStart, end: edit.selectionEnd })
    onChange?.(edit.value)
  }

  return (
    <>
      <textarea aria-label="Mensaje" ref={textareaRef} value={value} onChange={(event) => setValue(event.target.value)} />
      <CalculatorKeyboard onEdit={handleEdit} />
    </>
  )
}

function getInput() {
  return screen.getByRole('textbox', { name: 'Mensaje' }) as HTMLTextAreaElement
}

function expectInput(value: string, caret: number = value.length) {
  const input = getInput()
  expect(input.value).toBe(value)
  expect([input.selectionStart, input.selectionEnd]).toEqual([caret, caret])
}

async function pressKeys(user: User, ...names: string[]) {
  for (const name of names) {
    await user.click(getKey(name))
  }
}

async function openTab(user: User, label: string) {
  await user.click(getTab(label))
}

describe('Keys write at the cursor', () => {
  it('writes after existing text and leaves the cursor after it, with no added space', async () => {
    const user = newUser()
    renderWithTheme(<Host initialValue="2" />)

    await pressKeys(user, 'Variable x')

    expectInput('2x')
  })

  it('writes in the middle of the text', async () => {
    const user = newUser()
    renderWithTheme(<Host initialValue="ab" />)
    getInput().setSelectionRange(1, 1)

    await pressKeys(user, '7')

    expectInput('a7b', 2)
  })

  it('replaces the selected text', async () => {
    const user = newUser()
    renderWithTheme(<Host initialValue="abc def" />)
    getInput().setSelectionRange(4, 7)

    await pressKeys(user, 'Variable x')

    expectInput('abc x')
  })

  it('puts the cursor inside a template', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, 'Raíz cuadrada')

    expectInput('sqrt()', 5)
  })

  it('keeps the typed text when the tab changes', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, 'Variable x', 'Sumar', '1')
    await openTab(user, 'f(x)')

    expectInput('x+1')
  })

  it('keeps the writing position between keys', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, 'Raíz cuadrada', '4')

    expectInput('sqrt(4)', 6)
  })
})

describe('Numeric tab keys', () => {
  it('writes a number', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, '1', '2', 'Punto decimal', '5')

    expectInput('12.5')
  })

  it('writes every digit', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, '0', '1', '2', '3', '4', '5', '6', '7', '8', '9')

    expectInput('0123456789')
  })

  it('writes letters and constants', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, 'Variable x', 'Variable y', 'Número pi', 'Número e')

    expectInput('xyπe')
  })

  it('writes the operators, the minus as an ASCII hyphen-minus', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, 'Sumar', 'Restar', 'Multiplicar', 'Dividir', 'Igual')

    expectInput('+-×÷=')
    expect(getInput().value.includes('−')).toBe(false)
  })

  it('writes comparison signs, the comma and the parentheses', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, 'Menor que', 'Mayor que', 'Coma', 'Abrir paréntesis', 'Cerrar paréntesis')

    expectInput('<>,()')
  })

  it('writes squared after a variable', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, 'Variable x', 'Al cuadrado')

    expectInput('x^2')
  })

  it.each([
    ['Potencia', '^()', 2],
    ['Valor absoluto', 'abs()', 4],
    ['Fracción', '()/()', 1],
    ['Subíndice y superíndice', '_()^()', 2],
  ])('writes the %s template with the cursor in the first slot', async (name, written, caret) => {
    const user = newUser()
    renderWithTheme(<Host />)

    await pressKeys(user, name)

    expectInput(written, caret)
  })
})

describe('Function tab keys', () => {
  it.each([
    ['Seno', 'sen()', 4],
    ['Coseno', 'cos()', 4],
    ['Tangente', 'tg()', 3],
    ['Arcoseno', 'arcsen()', 7],
    ['Arcocoseno', 'arccos()', 7],
    ['Arcotangente', 'arctg()', 6],
    ['Logaritmo natural', 'ln()', 3],
    ['Logaritmo base 10', 'log10()', 6],
    ['Logaritmo con base', 'log_()()', 5],
    ['e elevado a', 'e^()', 3],
    ['10 elevado a', '10^()', 4],
    ['Raíz n-ésima', 'root(,)', 5],
    ['Derivada', 'd/dx()', 5],
    ['Integral', '∫  dx', 2],
    ['Subíndice', '_()', 2],
  ])('the %s key writes %j with the cursor at %i', async (name, written, caret) => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'f(x)')

    await pressKeys(user, name)

    expectInput(written, caret)
  })

  it('writes a subscript after a variable', async () => {
    const user = newUser()
    renderWithTheme(<Host initialValue="x" />)
    await openTab(user, 'f(x)')

    await pressKeys(user, 'Subíndice')

    expectInput('x_()', 3)
  })

  it('writes the single-character keys', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'f(x)')

    await pressKeys(
      user,
      'Porcentaje',
      'Factorial',
      'Signo de dólar',
      'Grado',
      'Abrir llave',
      'Cerrar llave',
      'Menor o igual',
      'Mayor o igual',
      'Unidad imaginaria',
    )

    expectInput('%!$°{}≤≥i')
  })

  it('lets the user fill a template and keep typing after it', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'f(x)')

    await pressKeys(user, 'Seno')
    await openTab(user, '123')
    await pressKeys(user, 'Variable x', 'Cursor a la derecha', 'Sumar', '1')

    expectInput('sen(x)+1')
  })
})

describe('Symbol tab keys', () => {
  it('writes the single-character symbols', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, '#&¬')

    await pressKeys(
      user,
      'Infinito',
      'Distinto',
      'Y lógico',
      'O lógico',
      'Negación',
      'Pertenece',
      'Subconjunto',
      'Subconjunto o igual',
      'Ángulo',
      'Flecha derecha',
    )

    expectInput('∞≠∧∨¬∈⊂⊆∠→')
  })

  it('writes the punctuation keys', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, '#&¬')

    await pressKeys(user, 'Punto y coma', 'Dos puntos', 'Apóstrofo', 'Comillas', 'Prima', 'Doble prima')

    expectInput(`;:'"′″`)
  })

  it.each([
    ['Techo', 'ceil()', 5],
    ['Piso', 'floor()', 6],
    ['Punto', '(,)', 1],
    ['Vector columna', '(;)', 1],
    ['Matriz', '{{,},{,}}', 2],
  ])('the %s key writes %j with the cursor at %i', async (name, written, caret) => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, '#&¬')

    await pressKeys(user, name)

    expectInput(written, caret)
  })
})

describe('Latin letters, shift and accent', () => {
  it('writes lowercase letters, including ñ, ï and ü', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')

    await pressKeys(user, 'q', 'ñ', 'ï', 'ü')

    expectInput('qñïü')
  })

  it('writes a space with the space bar', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')

    await pressKeys(user, 'a', 'Espacio', 'b')

    expectInput('a b')
  })

  it('capitalizes one letter with shift and then goes back to lowercase', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')

    await pressKeys(user, 'Mayúscula', 'a', 'b')

    expectInput('Ab')
    expect(getKey('Mayúscula')).toHaveAttribute('aria-pressed', 'false')
  })

  it('writes a lowercase letter after shift is pressed twice', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')

    await pressKeys(user, 'Mayúscula', 'Mayúscula', 'a')

    expectInput('a')
  })

  it('writes an accented vowel', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')

    await pressKeys(user, 'Acento agudo', 'e')

    expectInput('é')
  })

  it('writes a capital accented vowel with shift and accent', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')

    await pressKeys(user, 'Acento agudo', 'Mayúscula', 'a')

    expectInput('Á')
  })

  it('writes the accent itself before a consonant', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')

    await pressKeys(user, 'Acento agudo', 'b')

    expectInput('´b')
  })
})

describe('Greek letters', () => {
  it('writes Greek letters', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')
    await pressKeys(user, 'Letras griegas')

    await pressKeys(user, 'α', 'β', 'γ')

    expectInput('αβγ')
  })

  it('writes the capital form with shift', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')
    await pressKeys(user, 'Letras griegas', 'Mayúscula', 'θ')

    expectInput('Θ')
  })

  it('writes the two phi letters as different characters', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')
    await pressKeys(user, 'Letras griegas', 'ϕ', 'φ')

    expectInput('ϕφ')
    expect(getInput().value[0]).not.toBe(getInput().value[1])
  })

  it('leaves the text untouched when going back to Latin', async () => {
    const user = newUser()
    renderWithTheme(<Host />)
    await openTab(user, 'ABC')
    await pressKeys(user, 'Letras griegas', 'α', 'Letras latinas')

    expectInput('α')
    expect(getKey('q')).toBeInTheDocument()
  })
})

describe('Backspace, cursor keys and line break', () => {
  it('deletes the previous character', async () => {
    const user = newUser()
    renderWithTheme(<Host initialValue="x+1" />)

    await pressKeys(user, 'Retroceso')

    expectInput('x+')
  })

  it('deletes the selection', async () => {
    const user = newUser()
    renderWithTheme(<Host initialValue="x+1" />)
    getInput().setSelectionRange(1, 3)

    await pressKeys(user, 'Retroceso')

    expectInput('x')
  })

  it('does nothing at the start of the input', async () => {
    const user = newUser()
    renderWithTheme(<Host initialValue="x+1" />)
    getInput().setSelectionRange(0, 0)

    await pressKeys(user, 'Retroceso')

    expectInput('x+1', 0)
  })

  it('moves the cursor one character without changing the text', async () => {
    const user = newUser()
    renderWithTheme(<Host initialValue="abc" />)

    await pressKeys(user, 'Cursor a la izquierda')
    expectInput('abc', 2)

    await pressKeys(user, 'Cursor a la derecha', 'Cursor a la derecha')
    expectInput('abc', 3)
  })

  it('collapses a selection to its start when moving left', async () => {
    const user = newUser()
    renderWithTheme(<Host initialValue="abcd" />)
    getInput().setSelectionRange(1, 3)

    await pressKeys(user, 'Cursor a la izquierda')

    expectInput('abcd', 1)
  })

  it('inserts a line break and does not submit anything', async () => {
    const user = newUser()
    const onChange = vi.fn()
    renderWithTheme(<Host initialValue="x=1" onChange={onChange} />)

    await pressKeys(user, 'Salto de línea')

    expectInput('x=1\n')
    expect(onChange).toHaveBeenLastCalledWith('x=1\n')
  })

  it('has the control keys on every tab', async () => {
    const user = newUser()
    renderWithTheme(<Host />)

    for (const label of ['123', 'f(x)', 'ABC', '#&¬']) {
      await openTab(user, label)
      for (const name of ['Retroceso', 'Cursor a la izquierda', 'Cursor a la derecha', 'Salto de línea']) {
        expect(getKey(name), `${label}: ${name}`).toBeInTheDocument()
      }
    }
  })
})
