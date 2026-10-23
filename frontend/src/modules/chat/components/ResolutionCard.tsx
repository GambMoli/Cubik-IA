import { Box, Paper, Typography } from '@mui/material'

import { MathContent } from '../../../components/MathContent/MathContent'
import { MathFormula } from '../../../components/MathContent/MathFormula'
import type { Resolution } from '../types'

interface ResolutionCardProps {
  resolution: Resolution
  extractedExpression?: string | null
  errorMessage?: string | null
}

const labelSx = { fontWeight: 800, color: 'text.secondary', display: 'block', mb: 1 }

export function ResolutionCard({ resolution, extractedExpression, errorMessage }: ResolutionCardProps) {
  return (
    <Paper sx={{ p: 3, width: '100%', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 2 }}>
        Resolución paso a paso
      </Typography>

      <Box
        component="ol"
        sx={{
          m: 0,
          pl: 2.5,
          display: 'grid',
          gap: 1.5,
          color: 'text.primary',
          fontSize: '0.95rem',
        }}
      >
        {resolution.steps.map((step, index) => (
          <li key={`${step}-${index}`}>
            <MathContent content={step} />
          </li>
        ))}
      </Box>

      <Paper sx={{ my: 2.5, p: 2.5, bgcolor: 'background.default' }}>
        {extractedExpression ? (
          <>
            <Typography variant="caption" sx={labelSx}>
              Expresión interpretada
            </Typography>
            <MathFormula
              expression={extractedExpression}
              displayMode
              source="plain"
              style={{ overflowX: 'auto' }}
            />
          </>
        ) : null}
        <Typography variant="caption" sx={{ ...labelSx, mt: extractedExpression ? 2 : 0 }}>
          Resultado
        </Typography>
        <MathFormula
          expression={resolution.final_result}
          displayMode
          source="plain"
          style={{ overflowX: 'auto' }}
        />
      </Paper>

      <Box sx={{ color: 'text.secondary', fontSize: '0.94rem' }}>
        <MathContent content={resolution.explanation} />
      </Box>

      {errorMessage ? (
        <Typography sx={{ color: 'error.main', mt: 2, fontSize: '0.9rem', fontWeight: 600 }}>
          {errorMessage}
        </Typography>
      ) : null}
    </Paper>
  )
}
