import FunctionsIcon from '@mui/icons-material/Functions'
import SendIcon from '@mui/icons-material/Send'
import { Box, Button, IconButton, Paper, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { MathContent } from '../../../components/MathContent/MathContent'
import { MathFormula } from '../../../components/MathContent/MathFormula'
import { getMathPreview } from '../../../utils/math'
import type { MathPreview } from '../../../utils/math'
import { insertAtSelection } from '../../../utils/text'

interface ComposerProps {
  disabled?: boolean
  onSubmit: (message: string) => void | Promise<void>
}

const formulaSnippets = [
  { label: 'Integral', value: '∫ x^2 dx', preview: String.raw`\int x^2\,dx` },
  { label: 'Por partes', value: '∫ x e^x dx', preview: String.raw`\int x e^x\,dx` },
  { label: 'Derivada', value: 'd/dx (x^3 + 2x)', preview: String.raw`\frac{d}{dx}(x^3 + 2x)` },
  { label: 'Límite', value: 'lim x->0 sin(x)/x', preview: String.raw`\lim_{x \to 0} \sin(x)/x` },
  { label: 'Ecuación', value: 'x^2 + 3x = 10', preview: 'x^2 + 3x = 10' },
  { label: 'Raíz', value: 'sqrt(x^2 + 1)', preview: String.raw`\sqrt{x^2 + 1}` },
]

const FORMULA_PANEL_ID = 'composer-formula-panel'
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
  const [isFormulaPanelOpen, setIsFormulaPanelOpen] = useState(false)
  const [cursorRequest, setCursorRequest] = useState<{ position: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const canSend = !disabled && !isSending && message.trim().length > 0
  const preview = getMathPreview(message)

  // After a snippet is inserted, focus the input and put the cursor right after it.
  useEffect(() => {
    if (!cursorRequest) {
      return
    }
    const textarea = textareaRef.current
    textarea?.focus()
    textarea?.setSelectionRange(cursorRequest.position, cursorRequest.position)
  }, [cursorRequest])

  async function handleSubmit() {
    if (!canSend) {
      return
    }

    setIsSending(true)
    try {
      await onSubmit(message.trim())
      setMessage('')
      setIsFormulaPanelOpen(false)
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

  function insertSnippet(snippet: string) {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? message.length
    const end = textarea?.selectionEnd ?? message.length
    const { value, cursor } = insertAtSelection(message, start, end, snippet)

    setMessage(value)
    setCursorRequest({ position: cursor })
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<FunctionsIcon />}
          onClick={() => setIsFormulaPanelOpen((open) => !open)}
          variant={isFormulaPanelOpen ? 'contained' : 'text'}
          aria-expanded={isFormulaPanelOpen}
          aria-controls={FORMULA_PANEL_ID}
        >
          Insertar fórmula
        </Button>
      </Box>

      {isFormulaPanelOpen ? (
        <Paper
          id={FORMULA_PANEL_ID}
          role="region"
          aria-label="Fórmulas disponibles"
          sx={{
            p: 2.5,
            bgcolor: 'background.default',
            maxHeight: { xs: '45vh', md: '50vh' },
            overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            }}
          >
            {formulaSnippets.map((snippet) => (
              <Button
                key={snippet.label}
                fullWidth
                aria-label={`Insertar ${snippet.label}`}
                onClick={() => insertSnippet(snippet.value)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  minHeight: 116,
                  p: 2,
                  gap: 1,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'background.paper',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: 'primary.main',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {snippet.label}
                </Typography>
                <Box sx={{ width: '100%', overflowX: 'auto', textAlign: 'left' }}>
                  <MathFormula expression={snippet.preview} displayMode />
                </Box>
              </Button>
            ))}
          </Box>
          <Typography variant="caption" sx={{ mt: 1.5, display: 'block', color: 'text.secondary' }}>
            El asistente entiende entradas como <code>∫ x^2 dx</code>, <code>d/dx (x^3)</code> o{' '}
            <code>lim x-&gt;0 sin(x)/x</code>.
          </Typography>
        </Paper>
      ) : null}

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
            htmlInput: { 'aria-label': 'Mensaje' },
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
    </Box>
  )
}
