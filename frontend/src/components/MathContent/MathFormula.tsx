import katex from 'katex'
import { useMemo } from 'react'
import type { CSSProperties } from 'react'

import { plainMathToLatex } from '../../utils/math'

interface MathFormulaProps {
  expression: string
  displayMode?: boolean
  source?: 'latex' | 'plain'
  className?: string
  style?: CSSProperties
}

export function MathFormula({
  expression,
  displayMode = false,
  source = 'latex',
  className,
  style,
}: MathFormulaProps) {
  const html = useMemo(() => {
    const latex = source === 'plain' ? plainMathToLatex(expression) : expression.trim()

    // throwOnError is off so a malformed formula shows as text instead of breaking the page;
    // `trust` stays off so macros that could emit links or raw HTML are disabled.
    return katex.renderToString(latex || '\\,', {
      displayMode,
      throwOnError: false,
      strict: 'ignore',
    })
  }, [expression, displayMode, source])

  const Tag = displayMode ? 'div' : 'span'

  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}
