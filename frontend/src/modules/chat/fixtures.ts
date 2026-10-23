import type { Message } from './types'

// Temporary example data so every message variant can be reviewed without a backend.
// Remove together with the import in App.tsx when the chat is connected to the API.
export const sampleMessages: Message[] = [
  {
    id: 'sample-1',
    role: 'user',
    content: 'Hola, ¿me ayudas con una integral?',
  },
  {
    id: 'sample-2',
    role: 'assistant',
    content: 'Claro. Escribe la integral o adjunta una imagen y la resolvemos paso a paso.',
  },
  {
    id: 'sample-3',
    role: 'user',
    content: 'Resuelve esta integral\n\n∫ x^2 dx',
  },
  {
    id: 'sample-4',
    role: 'assistant',
    content: 'Listo, esta es la resolución.',
    exercise: {
      extracted_expression: '∫ x^2 dx',
      resolution: {
        steps: [
          'Identificamos la regla de la potencia: \\( \\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C \\).',
          'Con \\( n = 2 \\) obtenemos \\( \\frac{x^3}{3} + C \\).',
        ],
        final_result: 'x^3/3 + C',
        explanation:
          'Al integrar una potencia se suma uno al exponente y se divide entre el nuevo exponente. La constante \\( C \\) representa a todas las primitivas.',
      },
    },
  },
  {
    id: 'sample-5',
    role: 'assistant',
    content: 'Resolví la derivada, pero no pude verificar el resultado.',
    exercise: {
      extracted_expression: 'd/dx (x^3 + 2x)',
      error_message: 'No se pudo verificar el resultado con el motor simbólico.',
      resolution: {
        steps: ['Derivamos cada término: \\( 3x^2 + 2 \\).'],
        final_result: '3x^2 + 2',
        explanation: 'La derivada de una suma es la suma de las derivadas.',
      },
    },
  },
]
