import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderWithTheme } from '../../../testUtils'
import type { Resolution } from '../types'
import { ResolutionCard } from './ResolutionCard'

const resolution: Resolution = {
  steps: ['Primer paso del cálculo.', 'Segundo paso del cálculo.', 'Tercer paso del cálculo.'],
  final_result: 'x^3/3 + C',
  explanation: 'Se integra la potencia y se agrega la constante.',
}

function texOf(container: HTMLElement) {
  return Array.from(container.querySelectorAll('annotation[encoding="application/x-tex"]')).map(
    (node) => node.textContent,
  )
}

describe('ResolutionCard', () => {
  it('is titled "Resolución paso a paso"', () => {
    renderWithTheme(<ResolutionCard resolution={resolution} />)

    expect(screen.getByRole('heading', { name: 'Resolución paso a paso' })).toBeInTheDocument()
  })

  it('lists the steps in order', () => {
    renderWithTheme(<ResolutionCard resolution={resolution} />)

    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(resolution.steps)
  })

  it('shows the interpreted expression and the result as formulas, then the explanation', () => {
    const { container } = renderWithTheme(
      <ResolutionCard resolution={resolution} extractedExpression="∫ x^2 dx" />,
    )

    expect(screen.getByText('Expresión interpretada')).toBeInTheDocument()
    expect(screen.getByText('Resultado')).toBeInTheDocument()
    expect(texOf(container)).toEqual(['\\int x^2\\, dx', 'x^3/3 + C'])
    expect(screen.getByText('Se integra la potencia y se agrega la constante.')).toBeInTheDocument()
  })

  it('omits the interpreted expression block when there is none and still shows the result', () => {
    const { container } = renderWithTheme(<ResolutionCard resolution={resolution} extractedExpression={null} />)

    expect(screen.queryByText('Expresión interpretada')).not.toBeInTheDocument()
    expect(screen.getByText('Resultado')).toBeInTheDocument()
    expect(texOf(container)).toEqual(['x^3/3 + C'])
  })

  it('shows the exercise error message in the error color', () => {
    renderWithTheme(<ResolutionCard resolution={resolution} errorMessage="No se pudo verificar." />)

    expect(screen.getByText('No se pudo verificar.')).toHaveStyle({ color: 'rgb(211, 47, 47)' })
  })

  it('shows no error text when there is no error message', () => {
    renderWithTheme(<ResolutionCard resolution={resolution} />)

    expect(screen.queryByText(/verificar/)).not.toBeInTheDocument()
  })
})
