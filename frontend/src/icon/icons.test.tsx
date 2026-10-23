import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BotAvatarIcon } from './BotAvatarIcon'
import { UserAvatarIcon } from './UserAvatarIcon'

describe.each([
  ['BotAvatarIcon', BotAvatarIcon],
  ['UserAvatarIcon', UserAvatarIcon],
])('%s', (_name, Icon) => {
  it('renders a decorative SVG', () => {
    const { container } = render(<Icon />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('forwards className and style', () => {
    const { container } = render(<Icon className="avatar" style={{ width: 16 }} />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('avatar')
    expect(svg).toHaveStyle({ width: '16px' })
  })
})
