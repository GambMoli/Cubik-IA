import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithTheme } from '../../../testUtils'
import type { Message } from '../types'
import { ChatMessage } from './ChatMessage'

const resolution = {
  steps: ['Paso uno del cálculo.'],
  final_result: 'x + 1',
  explanation: 'Explicación breve del resultado.',
}

function assistantMessage(content: string, withResolution = false): Message {
  return {
    id: 'a1',
    role: 'assistant',
    content,
    exercise: withResolution ? { extracted_expression: 'x + 1', resolution } : null,
  }
}

function bubbleOf(text: string) {
  return screen.getByText(text).closest('.MuiPaper-root') as HTMLElement
}

function emittedCss() {
  return Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent)
    .join('')
}

describe('ChatMessage alignment and avatars', () => {
  it('aligns a user message to the right with the user avatar', () => {
    const { container } = renderWithTheme(<ChatMessage message={{ id: 'u1', role: 'user', content: 'Hola' }} />)

    const row = screen.getByRole('article', { name: 'Mensaje del usuario' })
    expect(row).toHaveStyle({ flexDirection: 'row-reverse' })
    expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1)
  })

  it('aligns an assistant message to the left', () => {
    renderWithTheme(<ChatMessage message={assistantMessage('Respuesta')} />)

    expect(screen.getByRole('article', { name: 'Mensaje del asistente' })).toHaveStyle({ flexDirection: 'row' })
  })

  it('shows a system message like an assistant message', () => {
    renderWithTheme(<ChatMessage message={{ id: 's1', role: 'system', content: 'Aviso' }} />)

    expect(screen.getByRole('article', { name: 'Mensaje del asistente' })).toHaveStyle({ flexDirection: 'row' })
  })
})

describe('ChatMessage bubbles', () => {
  it('gives the user bubble a primary background with white text', () => {
    renderWithTheme(<ChatMessage message={{ id: 'u1', role: 'user', content: 'Hola' }} />)

    expect(bubbleOf('Hola')).toHaveStyle({ backgroundColor: 'rgb(21, 71, 161)', color: 'rgb(255, 255, 255)' })
  })

  it('gives the assistant bubble a bordered surface with the normal text color', () => {
    renderWithTheme(<ChatMessage message={assistantMessage('Respuesta')} />)

    const bubble = bubbleOf('Respuesta')
    expect(bubble).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(25, 28, 29)' })
    expect(bubble).toHaveStyle({ borderStyle: 'solid', borderWidth: '1px' })
  })

  it('uses the dark palette colors in dark mode', () => {
    renderWithTheme(<ChatMessage message={assistantMessage('Respuesta')} />, 'dark')

    expect(bubbleOf('Respuesta')).toHaveStyle({ color: 'rgb(248, 250, 252)' })
  })

  it('limits the column to 78% from the medium breakpoint up', () => {
    renderWithTheme(<ChatMessage message={assistantMessage('Respuesta larga')} />)

    expect(emittedCss()).toMatch(/max-width:\s*100%/)
    expect(emittedCss()).toMatch(/@media \(min-width:\s*900px\)\s*\{[\s\S]*?max-width:\s*78%/)
  })
})

describe('ChatMessage resolution', () => {
  it('shows a text bubble above the card when the text is under 180 characters', () => {
    renderWithTheme(<ChatMessage message={assistantMessage('a'.repeat(179), true)} />)

    expect(screen.getByText('a'.repeat(179))).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Resolución paso a paso' })).toBeInTheDocument()
  })

  it('shows only the card when the text has 180 or more characters', () => {
    renderWithTheme(<ChatMessage message={assistantMessage('a'.repeat(180), true)} />)

    expect(screen.queryByText('a'.repeat(180))).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Resolución paso a paso' })).toBeInTheDocument()
  })

  it('ignores surrounding whitespace when counting the text length', () => {
    renderWithTheme(<ChatMessage message={assistantMessage(`  ${'a'.repeat(179)}  `, true)} />)

    expect(screen.getByText('a'.repeat(179))).toBeInTheDocument()
  })

  it('always shows the text of a long message that has no resolution', () => {
    renderWithTheme(<ChatMessage message={assistantMessage('b'.repeat(400))} />)

    expect(screen.getByText('b'.repeat(400))).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Resolución paso a paso' })).not.toBeInTheDocument()
  })

  it('passes the exercise error to the card', () => {
    const message: Message = {
      id: 'a2',
      role: 'assistant',
      content: 'Resultado parcial.',
      exercise: { resolution, error_message: 'No se pudo verificar.' },
    }
    renderWithTheme(<ChatMessage message={message} />)

    expect(screen.getByText('No se pudo verificar.')).toBeInTheDocument()
  })

  it('does not show a card for user messages even if an exercise is attached', () => {
    const message: Message = { id: 'u2', role: 'user', content: 'Mi pregunta', exercise: { resolution } }
    renderWithTheme(<ChatMessage message={message} />)

    expect(screen.queryByRole('heading', { name: 'Resolución paso a paso' })).not.toBeInTheDocument()
  })
})
