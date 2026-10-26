import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined'
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import KeyboardCapslockIcon from '@mui/icons-material/KeyboardCapslock'
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn'
import { Box, Button } from '@mui/material'
import { useReducer } from 'react'
import type { MouseEvent, ReactNode } from 'react'

import { MathFormula } from '../../../../components/MathContent/MathFormula'
import { editCommandFor, initialKeyboardState, keyboardReducer } from './keyboardState'
import type { EditCommand, KeyboardState } from './keyboardState'
import { isSpacer, layoutFor, tabs } from './layouts'
import type { IconName, Key, KeyDef, Row } from './layouts'

export interface KeyPress {
  // True when the key was pressed with a pointer, false when it was activated with Enter or Space.
  pointer: boolean
}

interface CalculatorKeyboardProps {
  onEdit: (command: EditCommand, press: KeyPress) => void
}

const PANEL_ID = 'calculator-keys'

// Tighter on phones: at 360 px the panel is about 300 px wide and the letter rows need every pixel
// to keep their keys at 24 px or more.
const KEY_GAP = { xs: 0.25, sm: 0.5 }

const icons: Record<IconName, ReactNode> = {
  backspace: <BackspaceOutlinedIcon fontSize="small" />,
  left: <KeyboardArrowLeftIcon fontSize="small" />,
  right: <KeyboardArrowRightIcon fontSize="small" />,
  enter: <KeyboardReturnIcon fontSize="small" />,
  shift: <KeyboardCapslockIcon fontSize="small" />,
}

// Widest row of a block, used to share the width between the blocks of a layout.
function rowWeight(row: Row): number {
  return row.reduce((sum, key) => sum + (key.weight ?? 1), 0)
}

function keyFace(key: KeyDef, state: KeyboardState): ReactNode {
  if (key.icon) {
    return icons[key.icon]
  }
  if (key.math) {
    return (
      <Box component="span" aria-hidden sx={{ display: 'inline-flex', '& .katex': { fontSize: '1.05em' } }}>
        <MathFormula expression={key.math} />
      </Box>
    )
  }
  if (key.action.kind === 'letter') {
    return state.shift ? key.action.upper : key.action.lower
  }
  return key.label
}

export function CalculatorKeyboard({ onEdit }: CalculatorKeyboardProps) {
  const [state, dispatch] = useReducer(keyboardReducer, initialKeyboardState)
  const layout = layoutFor(state.tab, state.alpha)

  function press(key: KeyDef, event: MouseEvent<HTMLButtonElement>) {
    const command = editCommandFor(state, key.action)

    dispatch({ type: 'key', action: key.action })
    if (command) {
      // `detail` is 0 for a click that comes from Enter or Space on a focused key.
      onEdit(command, { pointer: event.detail > 0 })
    }
  }

  function isActive(key: KeyDef): boolean {
    return (key.action.kind === 'shift' && state.shift) || (key.action.kind === 'accent' && state.accent)
  }

  function renderKey(key: Key) {
    if (isSpacer(key)) {
      return <Box key={key.id} aria-hidden sx={{ flex: `${key.weight ?? 1} 1 0`, minWidth: 0 }} />
    }

    const isToggle = key.action.kind === 'shift' || key.action.kind === 'accent'

    return (
      <Button
        key={key.id}
        aria-label={key.name}
        aria-pressed={isToggle ? isActive(key) : undefined}
        // Keeps the focus (and the selection) in the message input when a key is pressed with a pointer.
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => press(key, event)}
        sx={{
          flex: `${key.weight ?? 1} 1 0`,
          minWidth: 0,
          minHeight: 40,
          p: 0,
          borderRadius: 1,
          fontSize: '0.95rem',
          fontWeight: 500,
          lineHeight: 1,
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: key.tone === 'control' ? 'action.selected' : 'background.paper',
          '&:hover': { bgcolor: key.tone === 'control' ? 'action.focus' : 'background.paper', borderColor: 'primary.main' },
          '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 1 },
          ...(isActive(key) && { bgcolor: 'primary.light', color: 'primary.main', borderColor: 'primary.main' }),
        }}
      >
        {keyFace(key, state)}
      </Button>
    )
  }

  return (
    <Box role="region" aria-label="Calculadora" sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Box
        role="tablist"
        aria-label="Teclados de la calculadora"
        sx={{ display: 'flex', gap: 0.5, px: { xs: 0.5, sm: 0 }, pt: { xs: 0.5, sm: 0 } }}
      >
        {tabs.map((tab) => {
          const selected = state.tab === tab.id

          return (
            <Button
              key={tab.id}
              role="tab"
              id={`calculator-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={PANEL_ID}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => dispatch({ type: 'tab', tab: tab.id })}
              sx={{
                minWidth: 0,
                minHeight: 32,
                px: 1.75,
                borderRadius: 4,
                fontSize: '0.9rem',
                color: selected ? 'primary.main' : 'text.primary',
                bgcolor: selected ? 'primary.light' : 'transparent',
                '&:hover': { bgcolor: selected ? 'primary.light' : 'action.hover' },
              }}
            >
              {tab.label}
            </Button>
          )
        })}
      </Box>

      <Box
        role="tabpanel"
        id={PANEL_ID}
        aria-labelledby={`calculator-tab-${state.tab}`}
        sx={{ display: 'flex', gap: { xs: 1, sm: 2 } }}
      >
        {layout.blocks.map((block, blockIndex) => (
          <Box
            key={blockIndex}
            sx={{
              flex: `${rowWeight(block.rows[0])} 1 0`,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: KEY_GAP,
            }}
          >
            {block.rows.map((row, rowIndex) => (
              <Box key={rowIndex} sx={{ display: 'flex', gap: KEY_GAP }}>
                {row.map(renderKey)}
              </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
