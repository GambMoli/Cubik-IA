import { Box } from '@mui/material'
import type { ReactNode } from 'react'

import {
  looksLikeLatex,
  parseLabelledParagraph,
  sanitizeParagraph,
  shouldRenderStandaloneMath,
  splitBlockMath,
  splitInlineMath,
} from '../../utils/math'
import { MathFormula } from './MathFormula'

interface MathContentProps {
  content: string
}

function renderInlineText(text: string, keyPrefix: string): ReactNode[] {
  return splitInlineMath(text).map((segment, index) =>
    segment.kind === 'math' ? (
      <MathFormula key={`${keyPrefix}-math-${index}`} expression={segment.content} className="math-content__inline" />
    ) : (
      <span key={`${keyPrefix}-text-${index}`}>{segment.content}</span>
    ),
  )
}

function renderStandaloneMath(expression: string, key: string) {
  return (
    <MathFormula
      key={key}
      expression={expression}
      source={looksLikeLatex(expression) ? 'latex' : 'plain'}
      displayMode
      className="math-content__block"
    />
  )
}

function renderTextSegment(content: string, segmentIndex: number) {
  return content
    .split(/\n{2,}/)
    .map(sanitizeParagraph)
    .filter(Boolean)
    .map((paragraph, paragraphIndex) => {
      const key = `${segmentIndex}-${paragraphIndex}`
      const labelled = parseLabelledParagraph(paragraph)

      if (labelled) {
        const { label, rest } = labelled

        if (rest && shouldRenderStandaloneMath(rest)) {
          return (
            <div key={key} className="math-content__label-block">
              <span className="math-content__label">{label}:</span>
              {renderStandaloneMath(rest, `${key}-formula`)}
            </div>
          )
        }

        return (
          <p key={key} className="math-content__paragraph">
            <span className="math-content__label">{label}:</span>
            {rest ? <> {renderInlineText(rest, `${key}-label`)}</> : null}
          </p>
        )
      }

      if (shouldRenderStandaloneMath(paragraph)) {
        return renderStandaloneMath(paragraph, key)
      }

      return (
        <p key={key} className="math-content__paragraph">
          {renderInlineText(paragraph, key)}
        </p>
      )
    })
}

export function MathContent({ content }: MathContentProps) {
  return (
    <Box
      className="math-content"
      sx={{
        '& .math-content__paragraph': {
          m: 0,
          mb: 1.5,
          lineHeight: 1.7,
          whiteSpace: 'pre-line',
          overflowWrap: 'anywhere',
        },
        '& .math-content__label': { fontWeight: 700, mr: 0.5 },
        '& .math-content__block': { overflowX: 'auto' },
        '& .math-content__paragraph:last-child': { mb: 0 },
      }}
    >
      {splitBlockMath(content).map((segment, index) =>
        segment.kind === 'block' ? (
          <MathFormula
            key={`block-${index}`}
            expression={segment.content}
            displayMode
            className="math-content__block"
          />
        ) : (
          <div key={`text-${index}`}>{renderTextSegment(segment.content, index)}</div>
        ),
      )}
    </Box>
  )
}
