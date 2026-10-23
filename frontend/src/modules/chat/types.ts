export type MessageRole = 'user' | 'assistant' | 'system'

export interface Resolution {
  steps: string[]
  final_result: string
  explanation: string
}

export interface Exercise {
  extracted_expression?: string | null
  error_message?: string | null
  resolution?: Resolution | null
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  exercise?: Exercise | null
}
