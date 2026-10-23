import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBanner } from './StatusBanner'

describe('StatusBanner', () => {
  it('shows the message in an alert with the info tone by default', () => {
    render(<StatusBanner message="Todo en orden" />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Todo en orden')
    expect(alert).toHaveClass('MuiAlert-colorInfo')
  })

  it('shows the message in an alert with the error tone', () => {
    render(<StatusBanner tone="error" message="No se pudo cargar" />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('No se pudo cargar')
    expect(alert).toHaveClass('MuiAlert-colorError')
  })
})
