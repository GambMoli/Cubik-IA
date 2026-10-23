import { fireEvent, screen, waitFor, within } from '@testing-library/react'
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

function getFormulaToggle() {
  return screen.getByRole('button', { name: 'Insertar fórmula' })
}

const snippetLabels = ['Integral', 'Por partes', 'Derivada', 'Límite', 'Ecuación', 'Raíz']

describe('Composer formula panel', () => {
  it('opens a panel with the six snippet cards and shows the button as active', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    expect(screen.queryByRole('region', { name: 'Fórmulas disponibles' })).not.toBeInTheDocument()
    expect(getFormulaToggle()).toHaveClass('MuiButton-text')

    await user.click(getFormulaToggle())

    const panel = screen.getByRole('region', { name: 'Fórmulas disponibles' })
    for (const label of snippetLabels) {
      expect(within(panel).getByRole('button', { name: `Insertar ${label}` })).toBeInTheDocument()
    }
    expect(getFormulaToggle()).toHaveClass('MuiButton-contained')
    expect(getFormulaToggle()).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows a typeset preview and the label on every card', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.click(getFormulaToggle())

    const panel = screen.getByRole('region', { name: 'Fórmulas disponibles' })
    expect(panel.querySelectorAll('.katex')).toHaveLength(6)
    for (const label of snippetLabels) {
      expect(within(panel).getByText(label)).toBeInTheDocument()
    }
  })

  it('closes the panel when the button is clicked again', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.click(getFormulaToggle())
    await user.click(getFormulaToggle())

    expect(screen.queryByRole('region', { name: 'Fórmulas disponibles' })).not.toBeInTheDocument()
    expect(getFormulaToggle()).toHaveClass('MuiButton-text')
    expect(getFormulaToggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('limits the panel height and scrolls it when the content is taller', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.click(getFormulaToggle())

    const panel = screen.getByRole('region', { name: 'Fórmulas disponibles' })
    expect(panel).toHaveStyle({ overflowY: 'auto' })
    const css = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent)
      .join('')
    expect(css).toMatch(/max-height:\s*45vh/)
    expect(css).toMatch(/@media \(min-width:\s*900px\)\s*\{[\s\S]*?max-height:\s*50vh/)
  })

  it('shows a usage hint with example inputs while open', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.click(getFormulaToggle())

    const panel = screen.getByRole('region', { name: 'Fórmulas disponibles' })
    expect(within(panel).getByText('∫ x^2 dx')).toBeInTheDocument()
    expect(within(panel).getByText('d/dx (x^3)')).toBeInTheDocument()
  })

  it('closes the panel after a message is submitted', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)

    await user.click(getFormulaToggle())
    await user.type(getInput(), 'x + 1')
    await user.click(getSendButton())

    await waitFor(() => expect(screen.queryByRole('region', { name: 'Fórmulas disponibles' })).not.toBeInTheDocument())
    expect(getInput()).toHaveValue('')
  })
})

describe('Composer snippet insertion', () => {
  async function openPanel(user: ReturnType<typeof userEvent.setup>) {
    await user.click(getFormulaToggle())
  }

  it('inserts the expression into an empty input and focuses it', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await openPanel(user)

    await user.click(screen.getByRole('button', { name: 'Insertar Integral' }))

    expect(getInput()).toHaveValue('∫ x^2 dx')
    expect(getInput()).toHaveFocus()
  })

  it('adds a single space before the expression after existing text', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await user.type(getInput(), 'Resuelve')
    await openPanel(user)

    await user.click(screen.getByRole('button', { name: 'Insertar Ecuación' }))

    expect(getInput()).toHaveValue('Resuelve x^2 + 3x = 10')
  })

  it('does not add a space when the text already ends with one', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await user.type(getInput(), 'Resuelve ')
    await openPanel(user)

    await user.click(screen.getByRole('button', { name: 'Insertar Raíz' }))

    expect(getInput()).toHaveValue('Resuelve sqrt(x^2 + 1)')
  })

  it('replaces the selected text', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await user.type(getInput(), 'abc def')
    ;(getInput() as HTMLTextAreaElement).setSelectionRange(4, 7)
    await openPanel(user)

    await user.click(screen.getByRole('button', { name: 'Insertar Derivada' }))

    expect(getInput()).toHaveValue('abc d/dx (x^3 + 2x)')
  })

  it('puts the cursor right after the inserted text', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithTheme(<Composer onSubmit={vi.fn()} />)
    await user.type(getInput(), 'ab')
    ;(getInput() as HTMLTextAreaElement).setSelectionRange(1, 1)
    await openPanel(user)

    await user.click(screen.getByRole('button', { name: 'Insertar Integral' }))

    const input = getInput() as HTMLTextAreaElement
    expect(input.value).toBe('a ∫ x^2 dxb')
    expect(input.selectionStart).toBe('a ∫ x^2 dx'.length)
    expect(input.selectionEnd).toBe('a ∫ x^2 dx'.length)
  })
})
