import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import SendIcon from '@mui/icons-material/Send'
import { Box, Button, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { MathContent } from '../../../components/MathContent/MathContent'
import { MathFormula } from '../../../components/MathContent/MathFormula'
import { getMathPreview } from '../../../utils/math'
import type { MathPreview } from '../../../utils/math'
import { CalculatorKeyboard, applyEditCommand } from './CalculatorKeyboard'
import type { EditCommand, KeyPress } from './CalculatorKeyboard'

interface ComposerProps {
  disabled?: boolean
  onSubmit: (message: string) => void | Promise<void>
}

const CALCULATOR_PANEL_ID = 'composer-calculator-panel'
const PREVIEW_TITLE_ID = 'composer-math-preview-title'

function renderPreview(preview: MathPreview, message: string) {
  switch (preview.kind) {
    case 'lines':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {preview.lines.map((line, index) => (
            <MathFormula key={`${index}-${line}`} expression={line} source="plain" displayMode />
          ))}
        </Box>
      )
    case 'block':
      return <MathContent content={message} />
    case 'single':
      return <MathFormula expression={preview.latex} displayMode />
    default:
      return null
  }
}

export function Composer({ disabled = false, onSubmit }: ComposerProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [cursorRequest, setCursorRequest] = useState<{ start: number; end: number; focus: boolean } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const canSend = !disabled && !isSending && message.trim().length > 0
  const preview = getMathPreview(message)

  // After a calculator key edits the text, put the cursor where the key left it. A pointer press
  // also puts the focus back in the input; a key activated from the keyboard keeps the focus.
  useEffect(() => {
    if (!cursorRequest) {
      return
    }
    const textarea = textareaRef.current
    if (cursorRequest.focus) {
      textarea?.focus()
    }
    textarea?.setSelectionRange(cursorRequest.start, cursorRequest.end)
  }, [cursorRequest])

  async function handleSubmit() {
    if (!canSend) {
      return
    }

    setIsSending(true)
    try {
      await onSubmit(message.trim())
      setMessage('')
      setIsCalculatorOpen(false)
    } catch {
      // The parent reports the failure; keep the text so the user can send it again.
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // keyCode 229 is how some browsers report Enter that only confirms an input-method composition.
    const isComposing = event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229

    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  function handleCalculatorEdit(command: EditCommand, press: KeyPress) {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? message.length
    const end = textarea?.selectionEnd ?? message.length
    const edit = applyEditCommand(command, message, start, end)

    setMessage(edit.value)
    setCursorRequest({ start: edit.selectionStart, end: edit.selectionEnd, focus: press.pointer })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<CalculateOutlinedIcon />}
          onClick={() => setIsCalculatorOpen((open) => !open)}
          variant={isCalculatorOpen ? 'contained' : 'text'}
          aria-expanded={isCalculatorOpen}
          aria-controls={CALCULATOR_PANEL_ID}
        >
          Abrir Calculadora
        </Button>
      </Box>

      {preview.kind !== 'none' ? (
        <Paper
          role="region"
          aria-labelledby={PREVIEW_TITLE_ID}
          sx={{ p: 2.5, bgcolor: 'background.default' }}
        >
          <Typography
            id={PREVIEW_TITLE_ID}
            variant="caption"
            sx={{
              fontWeight: 800,
              color: 'primary.main',
              mb: 1,
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Vista previa matemática
          </Typography>
          <Box sx={{ overflowX: 'auto' }}>{renderPreview(preview, message)}</Box>
        </Paper>
      ) : null}

      <Paper
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1.5,
          p: 1.5,
          bgcolor: 'background.default',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={6}
          placeholder="Escribe tu consulta matemática aquí..."
          value={message}
          disabled={disabled}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          inputRef={textareaRef}
          variant="standard"
          slotProps={{
            input: { disableUnderline: true, sx: { fontSize: '0.98rem', py: 0.5 } },
            // While the calculator is open the device keyboard stays hidden, so it does not cover the keys.
            htmlInput: { 'aria-label': 'Mensaje', inputMode: isCalculatorOpen ? 'none' : undefined },
          }}
        />
        <Tooltip title="Enviar mensaje">
          <span>
            <IconButton
              aria-label="Enviar mensaje"
              onClick={() => void handleSubmit()}
              disabled={!canSend}
              sx={{
                bgcolor: 'primary.main',
                color: '#FFFFFF',
                borderRadius: 2,
                p: 1.5,
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Paper>

      {/* Under the input and the preview, like a device keyboard, so the text stays in view above the keys. */}
      {isCalculatorOpen ? (
        <Paper
          id={CALCULATOR_PANEL_ID}
          sx={{
            p: { xs: 0.25, sm: 2.5 },
            bgcolor: 'background.default',
            maxHeight: { xs: '45vh', md: '50vh' },
            overflowY: 'auto',
          }}
        >
          <CalculatorKeyboard onEdit={handleCalculatorEdit} />
        </Paper>
      ) : null}
    </Box>
  )
}
