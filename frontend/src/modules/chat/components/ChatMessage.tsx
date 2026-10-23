import { Avatar, Box, Paper } from '@mui/material'

import { MathContent } from '../../../components/MathContent/MathContent'
import { BotAvatarIcon } from '../../../icon/BotAvatarIcon'
import { UserAvatarIcon } from '../../../icon/UserAvatarIcon'
import type { Message } from '../types'
import { ResolutionCard } from './ResolutionCard'

// With a resolution card, a text this long only repeats what the card already shows.
const LONG_TEXT_LENGTH = 180

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistantLike = message.role !== 'user'
  const exercise = isAssistantLike ? message.exercise : null
  const resolution = exercise?.resolution ?? null
  const shouldShowBody = !resolution || message.content.trim().length < LONG_TEXT_LENGTH

  return (
    <Box
      role="article"
      aria-label={isAssistantLike ? 'Mensaje del asistente' : 'Mensaje del usuario'}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        flexDirection: isAssistantLike ? 'row' : 'row-reverse',
      }}
    >
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: isAssistantLike ? 'primary.light' : 'background.paper',
          color: isAssistantLike ? 'primary.main' : 'text.secondary',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {isAssistantLike ? <BotAvatarIcon style={{ width: 16 }} /> : <UserAvatarIcon style={{ width: 16 }} />}
      </Avatar>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          alignItems: isAssistantLike ? 'flex-start' : 'flex-end',
          minWidth: 0,
          maxWidth: { xs: '100%', md: '78%' },
        }}
      >
        {shouldShowBody ? (
          <Paper
            sx={{
              bgcolor: isAssistantLike ? 'background.paper' : 'primary.main',
              color: isAssistantLike ? 'text.primary' : '#FFFFFF',
              p: 2.5,
              borderTopLeftRadius: isAssistantLike ? 2 : 8,
              borderTopRightRadius: isAssistantLike ? 8 : 2,
              borderColor: isAssistantLike ? 'divider' : 'primary.main',
            }}
          >
            <MathContent content={message.content} />
          </Paper>
        ) : null}

        {resolution ? (
          <ResolutionCard
            resolution={resolution}
            extractedExpression={exercise?.extracted_expression}
            errorMessage={exercise?.error_message}
          />
        ) : null}
      </Box>
    </Box>
  )
}
