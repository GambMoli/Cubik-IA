import ChatBubbleOutlinedIcon from '@mui/icons-material/ChatBubbleOutlined'
import { Box, Typography } from '@mui/material'

export function EmptyConversationState() {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: 'primary.light',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <ChatBubbleOutlinedIcon fontSize="small" />
      </Box>

      <Box
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          p: 2.5,
          borderRadius: 3,
          borderTopLeftRadius: 4,
          maxWidth: '75%',
        }}
      >
        <Typography variant="body2" sx={{ fontSize: '0.95rem' }}>
          Hola. Soy tu asistente de <strong>Cubik IA</strong>. Estoy listo para ayudarte con cálculo,
          álgebra, estadística y otros ejercicios matemáticos. ¿Qué problema resolvemos hoy?
        </Typography>
      </Box>
    </Box>
  )
}
