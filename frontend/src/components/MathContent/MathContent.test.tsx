import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MathContent } from './MathContent'
import { MathFormula } from './MathFormula'

function texOf(container: HTMLElement) {
  return Array.from(container.querySelectorAll('annotation[encoding="application/x-tex"]')).map(
    (node) => node.textContent,
  )
}

describe('MathContent', () => {
  it('renders \\[ \\] as a display formula', () => {
    const { container } = render(<MathContent content={'\\[ \\int x^2\\,dx \\]'} />)

    expect(container.querySelector('.katex-display')).toBeInTheDocument()
    expect(texOf(container)).toEqual(['\\int x^2\\,dx'])
  })

  it('renders \\( \\) inline inside the sentence', () => {
    const { container } = render(<MathContent content={'the value \\( x^2 \\) grows'} />)

    const paragraph = container.querySelector('p')
    expect(paragraph).toHaveTextContent('the value')
    expect(paragraph).toHaveTextContent('grows')
    expect(paragraph?.querySelector('.katex')).toBeInTheDocument()
    expect(container.querySelector('.katex-display')).not.toBeInTheDocument()
  })

  it('renders a plain-text math paragraph as a formula', () => {
    const { container } = render(<MathContent content="x^2 + 3x = 10" />)

    expect(container.querySelector('.katex-display')).toBeInTheDocument()
    expect(texOf(container)).toEqual(['x^2 + 3x = 10'])
  })

  it('keeps a narrative sentence as text', () => {
    const { container } = render(<MathContent content="Primero despejamos la variable x." />)

    expect(screen.getByText('Primero despejamos la variable x.')).toBeInTheDocument()
    expect(container.querySelector('.katex')).not.toBeInTheDocument()
  })

  it('splits paragraphs on blank lines', () => {
    const { container } = render(<MathContent content={'Primer párrafo con texto.\n\nSegundo párrafo con texto.'} />)

    expect(container.querySelectorAll('p')).toHaveLength(2)
  })

  it('shows a label next to a formula', () => {
    const { container } = render(<MathContent content="Resultado final: x = 2" />)

    expect(screen.getByText('Resultado final:')).toBeInTheDocument()
    expect(container.querySelector('.katex-display')).toBeInTheDocument()
  })

  it('does not throw on a malformed formula and still shows the rest of the message', () => {
    const { container } = render(<MathContent content={'Antes del error.\n\n\\[ \\frac{1}{ \\]'} />)

    expect(screen.getByText('Antes del error.')).toBeInTheDocument()
    expect(container.querySelector('.katex-error')).toBeInTheDocument()
  })

  it('ignores empty and undefined paragraphs', () => {
    const { container } = render(<MathContent content={'undefined\n\nTexto real aquí.'} />)

    expect(container.querySelectorAll('p')).toHaveLength(1)
    expect(container).not.toHaveTextContent('undefined')
  })
})

describe('MathFormula', () => {
  it('converts plain notation before typesetting', () => {
    const { container } = render(<MathFormula expression="sqrt(x^2 + 1)" source="plain" />)

    expect(texOf(container)).toEqual(['\\sqrt{x^2 + 1}'])
  })

  it('uses a block element in display mode and an inline element otherwise', () => {
    const { container: block } = render(<MathFormula expression="x" displayMode />)
    const { container: inline } = render(<MathFormula expression="x" />)

    expect(block.firstElementChild?.tagName).toBe('DIV')
    expect(inline.firstElementChild?.tagName).toBe('SPAN')
  })
})
