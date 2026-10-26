import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithTheme } from '../../../testUtils'
import { Composer } from './Composer'

function getInput() {
  return screen.getByRole('textbox', { name: 'Mensaje' })
}

function getSendButton() {
  return screen.getByRole('button', { name: 'Enviar mensaje' })
}

describe('Composer input', () => {
  it('shows the placeholder when empty', () => {
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    expect(screen.getByPlaceholderText('Escribe tu consulta matemática aquí...')).toBeInTheDocument()
  })
})

describe('Composer sending', () => {
  it('sends the trimmed text with the button', async () => {
    const user = userEvent.setup({ delay: null })
    const onSubmit = vi.fn()
    renderWithTheme(<Composer onSubmit={onSubmit} />)

    await user.type(getInput(), '  x^2 + 1  ')
    await user.click(getSendButton())

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('x^2 + 1')
  })

  it('sends with Enter without adding a line break', async () => {
    const user = userEvent.setup({ delay: null })
    const onSubmit = vi.fn()
    renderWithTheme(<Composer onSubmit={onSubmit} />)

    await user.type(getInput(), 'hola{Enter}')

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('hola')
    await waitFor(() => expect(getInput()).toHaveValue(''))
  })

  it('inserts a line break with Shift+Enter and does not send', async () => {
    const user = userEvent.setup({ delay: null })
    const onSubmit = vi.fn()
    renderWithTheme(<Composer onSubmit={onSubmit} />)

    await user.type(getInput(), 'a{Shift>}{Enter}{/Shift}b')

    expect(getInput()).toHaveValue('a\nb')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not send when Enter only confirms a text composition', async () => {
    const user = userEvent.setup({ delay: null })
    const onSubmit = vi.fn()
    renderWithTheme(<Composer onSubmit={onSubmit} />)

    await user.type(getInput(), 'cafe')
    fireEvent.keyDown(getInput(), { key: 'Enter', isComposing: true })
    fireEvent.keyDown(getInput(), { key: 'Enter', keyCode: 229 })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(getInput()).toHaveValue('cafe')
  })

  it('does not send the same message twice while the first send is pending', async () => {
    const user = userEvent.setup({ delay: null })
    let finish: () => void = () => {}
    const onSubmit = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    renderWithTheme(<Composer onSubmit={onSubmit} />)

    await user.type(getInput(), 'hola{Enter}{Enter}')

    expect(onSubmit).toHaveBeenCalledTimes(1)
    finish()
  })

  it('keeps the text when sending fails so it can be sent again', async () => {
    const user = userEvent.setup({ delay: null })
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'))
    renderWithTheme(<Composer onSubmit={onSubmit} />)

    await user.type(getInput(), 'hola{Enter}')

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(getInput()).toHaveValue('hola')
    await waitFor(() => expect(getSendButton()).toBeEnabled())
  })
})

describe('Composer blank messages', () => {
  it('disables the send button and ignores Enter for empty or whitespace-only input', async () => {
    const user = userEvent.setup({ delay: null })
    const onSubmit = vi.fn()
    renderWithTheme(<Composer onSubmit={onSubmit} />)

    expect(getSendButton()).toBeDisabled()

    await user.type(getInput(), '   {Enter}')

    expect(getSendButton()).toBeDisabled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('enables the send button once there is text', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.type(getInput(), 'x')

    expect(getSendButton()).toBeEnabled()
  })
})

describe('Composer reset', () => {
  it('clears the input after a message is submitted', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.type(getInput(), 'x + 1')
    await user.click(getSendButton())

    await waitFor(() => expect(getInput()).toHaveValue(''))
  })
})

describe('Composer disabled', () => {
  it('blocks editing and sending while disabled', () => {
    renderWithTheme(<Composer disabled onSubmit={vi.fn()} />)

    expect(getInput()).toBeDisabled()
    expect(getSendButton()).toBeDisabled()
  })
})

function texOf(container: HTMLElement) {
  return Array.from(container.querySelectorAll('annotation[encoding="application/x-tex"]')).map(
    (node) => node.textContent,
  )
}

function queryPreview() {
  return screen.queryByRole('region', { name: 'Vista previa matemática' })
}

describe('Composer live math preview', () => {
  it('previews a single expression as a typeset formula', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.type(getInput(), 'lim x->0 sin(x)/x')

    const preview = screen.getByRole('region', { name: 'Vista previa matemática' })
    expect(texOf(preview)).toEqual(['\\lim_{x \\to 0} \\sin(x)/x'])
  })

  it('previews one formula per math line when there are several', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.type(getInput(), 'x + 1 = 2{Shift>}{Enter}{/Shift}y^2 = 9')

    const preview = screen.getByRole('region', { name: 'Vista previa matemática' })
    expect(texOf(preview)).toEqual(['x + 1 = 2', 'y^2 = 9'])
  })

  it('previews block delimiters the way a message is rendered', () => {
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    fireEvent.change(getInput(), { target: { value: '\\[ \\int x\\,dx \\]' } })

    const preview = screen.getByRole('region', { name: 'Vista previa matemática' })
    expect(preview.querySelector('.katex-display')).toBeInTheDocument()
    expect(texOf(preview)).toEqual(['\\int x\\,dx'])
  })

  it('shows no preview for plain words', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.type(getInput(), 'hola mundo')

    expect(queryPreview()).not.toBeInTheDocument()
  })

  it('hides the preview when the math is removed or the message is sent', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.type(getInput(), 'x^2 = 4')
    expect(queryPreview()).toBeInTheDocument()

    await user.clear(getInput())
    expect(queryPreview()).not.toBeInTheDocument()

    await user.type(getInput(), 'x^2 = 4{Enter}')
    await waitFor(() => expect(queryPreview()).not.toBeInTheDocument())
  })
})

function getCalculatorToggle() {
  return screen.getByRole('button', { name: 'Abrir Calculadora' })
}

function getCalculatorPanel() {
  return document.getElementById('composer-calculator-panel')
}

function getKey(name: string) {
  return within(screen.getByRole('tabpanel')).getByRole('button', { name })
}

type User = ReturnType<typeof userEvent.setup>

async function openCalculator(user: User) {
  await user.click(getCalculatorToggle())
}

describe('Composer calculator panel', () => {
  it('has an "Abrir Calculadora" button and no "Insertar fórmula" button', () => {
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    expect(getCalculatorToggle()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Insertar fórmula' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Calculadora' })).not.toBeInTheDocument()
  })

  it('opens the calculator on its 123 tab and shows the button as active', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    expect(getCalculatorToggle()).toHaveClass('MuiButton-text')
    expect(getCalculatorToggle()).toHaveAttribute('aria-expanded', 'false')

    await openCalculator(user)

    expect(screen.getByRole('region', { name: 'Calculadora' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '123' })).toHaveAttribute('aria-selected', 'true')
    expect(getKey('Raíz cuadrada')).toBeInTheDocument()
    expect(getCalculatorToggle()).toHaveClass('MuiButton-contained')
    expect(getCalculatorToggle()).toHaveAttribute('aria-expanded', 'true')
    expect(getCalculatorToggle()).toHaveAttribute('aria-controls', getCalculatorPanel()?.id)
  })

  it('puts the calculator last, under the message input and the math preview', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await openCalculator(user)
    await user.type(getInput(), 'x^2 = 4')

    const preview = screen.getByRole('region', { name: 'Vista previa matemática' })
    const inputRow = getInput().closest('.MuiPaper-root') as HTMLElement
    const panel = getCalculatorPanel() as HTMLElement
    const follows = (first: Node, second: Node) =>
      Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)

    expect(follows(getCalculatorToggle(), preview)).toBe(true)
    expect(follows(preview, inputRow)).toBe(true)
    expect(follows(inputRow, panel)).toBe(true)
    expect(panel).not.toContainElement(inputRow)
  })

  it('closes the panel when the button is clicked again', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await openCalculator(user)
    await openCalculator(user)

    expect(screen.queryByRole('region', { name: 'Calculadora' })).not.toBeInTheDocument()
    expect(getCalculatorToggle()).toHaveClass('MuiButton-text')
    expect(getCalculatorToggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('limits the panel height and scrolls it when the content is taller', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await openCalculator(user)

    expect(getCalculatorPanel()).toHaveStyle({ overflowY: 'auto' })
    const css = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent)
      .join('')
    expect(css).toMatch(/max-height:\s*45vh/)
    expect(css).toMatch(/@media \(min-width:\s*900px\)\s*\{[\s\S]*?max-height:\s*50vh/)
  })

  it('closes the panel and clears the input after a message is submitted', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await openCalculator(user)
    await user.type(getInput(), 'x + 1')
    await user.click(getSendButton())

    await waitFor(() => expect(screen.queryByRole('region', { name: 'Calculadora' })).not.toBeInTheDocument())
    expect(getInput()).toHaveValue('')
  })

  it('keeps the device keyboard hidden only while the calculator is open', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    expect(getInput()).not.toHaveAttribute('inputmode')

    await openCalculator(user)
    expect(getInput()).toHaveAttribute('inputmode', 'none')

    await openCalculator(user)
    expect(getInput()).not.toHaveAttribute('inputmode')
  })

  it('keeps typing with a physical keyboard while the calculator is open', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await openCalculator(user)
    await user.type(getInput(), 'x')

    expect(getInput()).toHaveValue('x')
  })

  it('does not send when the line break key of the calculator is pressed', async () => {
    const user = userEvent.setup({ delay: null })
    const onSubmit = vi.fn()
    renderWithTheme(<Composer onSubmit={onSubmit} />)

    await openCalculator(user)
    await user.type(getInput(), 'x=1')
    await user.click(getKey('Salto de línea'))

    expect(getInput()).toHaveValue('x=1\n')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('Composer calculator keys', () => {
  it('writes into an empty input and focuses it', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)

    await user.click(getKey('Variable x'))

    expect(getInput()).toHaveValue('x')
    expect(getInput()).toHaveFocus()
  })

  it('writes right after the existing text with no added space', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await user.type(getInput(), '2')
    await openCalculator(user)

    await user.click(getKey('Variable x'))

    expect(getInput()).toHaveValue('2x')
  })

  it('writes in the middle of the text and leaves the cursor after the key text', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await user.type(getInput(), 'ab')
    ;(getInput() as HTMLTextAreaElement).setSelectionRange(1, 1)
    await openCalculator(user)

    await user.click(getKey('7'))

    const input = getInput() as HTMLTextAreaElement
    expect(input.value).toBe('a7b')
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 2])
  })

  it('replaces the selected text', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await user.type(getInput(), 'abc def')
    ;(getInput() as HTMLTextAreaElement).setSelectionRange(4, 7)
    await openCalculator(user)

    await user.click(getKey('Variable x'))

    expect(getInput()).toHaveValue('abc x')
  })

  it('puts the cursor inside the template a key opens', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)

    await user.click(getKey('Raíz cuadrada'))

    const input = getInput() as HTMLTextAreaElement
    expect(input.value).toBe('sqrt()')
    expect([input.selectionStart, input.selectionEnd]).toEqual([5, 5])
  })

  it('keeps writing inside the template after a key press', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)

    await user.click(getKey('Raíz cuadrada'))
    await user.keyboard('x+1')

    expect(getInput()).toHaveValue('sqrt(x+1)')
  })

  it('keeps the focus in the input after a key is pressed with the mouse', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)
    expect(getInput()).not.toHaveFocus()

    await user.click(getKey('7'))
    await user.click(getKey('Retroceso'))

    expect(getInput()).toHaveFocus()
    expect(getInput()).toHaveValue('')
  })

  it('keeps the focus on the key and writes at the last cursor position when a key is activated from the keyboard', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await user.type(getInput(), 'ab')
    ;(getInput() as HTMLTextAreaElement).setSelectionRange(1, 1)
    await openCalculator(user)

    const key = getKey('7')
    act(() => key.focus())
    await user.keyboard('{Enter}')

    const input = getInput() as HTMLTextAreaElement
    expect(input.value).toBe('a7b')
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 2])
    expect(key).toHaveFocus()

    await user.keyboard(' ')
    expect(input.value).toBe('a77b')
    expect(key).toHaveFocus()
  })

  it('moves the cursor and deletes with the calculator keys', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await user.type(getInput(), 'abc')
    await openCalculator(user)

    await user.click(getKey('Cursor a la izquierda'))
    await user.click(getKey('Retroceso'))

    const input = getInput() as HTMLTextAreaElement
    expect(input.value).toBe('ac')
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 1])
  })

  it('sends the plain text the keys wrote', async () => {
    const user = userEvent.setup({ delay: null })
    const onSubmit = vi.fn()
    renderWithTheme(<Composer onSubmit={onSubmit} />)
    await openCalculator(user)

    await user.click(getKey('Raíz cuadrada'))
    await user.keyboard('x')
    await user.click(getSendButton())

    expect(onSubmit).toHaveBeenCalledWith('sqrt(x)')
  })
})

describe('Composer preview of calculator output', () => {
  function previewTex() {
    return texOf(screen.getByRole('region', { name: 'Vista previa matemática' }))
  }

  it('previews a square root and what is typed inside it', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)

    await user.click(getKey('Raíz cuadrada'))
    await user.keyboard('x^2 + 1')

    expect(previewTex()).toEqual(['\\sqrt{x^2 + 1}'])
  })

  it('previews a parenthesized fraction as a stacked fraction', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)

    await user.click(getKey('Fracción'))
    await user.keyboard('x+1')
    for (let moves = 0; moves < 3; moves += 1) {
      await user.click(getKey('Cursor a la derecha'))
    }
    await user.keyboard('x-1')

    expect(getInput()).toHaveValue('(x+1)/(x-1)')
    expect(previewTex()).toEqual(['\\frac{x+1}{x-1}'])
  })

  it('previews a grouped exponent', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)
    await user.click(screen.getByRole('tab', { name: 'f(x)' }))

    await user.click(getKey('e elevado a'))
    await user.keyboard('x+1')

    expect(getInput()).toHaveValue('e^(x+1)')
    expect(previewTex()).toEqual(['e^{x+1}'])
  })

  it('previews a Greek letter', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)
    await user.click(screen.getByRole('tab', { name: 'ABC' }))
    await user.click(getKey('Letras griegas'))

    await user.click(getKey('α'))

    expect(previewTex()).toEqual(['\\alpha'])
  })

  it('previews a product written with the × key', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)

    await user.click(getKey('3'))
    await user.click(getKey('Multiplicar'))
    await user.click(getKey('4'))

    expect(getInput()).toHaveValue('3×4')
    expect(previewTex()).toEqual(['3\\times 4'])
  })

  it('hides the preview when the keys wrote no math', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openCalculator(user)
    await user.click(screen.getByRole('tab', { name: 'ABC' }))

    await user.click(getKey('h'))
    await user.click(getKey('o'))
    await user.click(getKey('l'))
    await user.click(getKey('a'))

    expect(getInput()).toHaveValue('hola')
    expect(queryPreview()).not.toBeInTheDocument()
  })
})
