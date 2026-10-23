import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmptyConversationState } from './EmptyConversationState'

describe('EmptyConversationState', () => {
  it('introduces Cubik IA and invites a math question', () => {
    render(<EmptyConversationState />)

    expect(screen.getByText('Cubik IA')).toBeInTheDocument()
    expect(screen.getByText(/¿Qué problema resolvemos hoy\?/)).toBeInTheDocument()
  })

  it('shows the assistant avatar next to the message', () => {
    render(<EmptyConversationState />)

    expect(screen.getByTestId('ChatBubbleOutlinedIcon')).toBeInTheDocument()
  })
})
