import { deleteBackward, insertText, moveCursor } from '../../../../utils/text'
import type { TextEdit } from '../../../../utils/text'
import type { AlphaLayoutId, KeyAction, TabId } from './layouts'

export interface KeyboardState {
  tab: TabId
  alpha: AlphaLayoutId
  shift: boolean
  accent: boolean
}

// What a key press asks the owner of the text to do. The keyboard never edits text itself.
export type EditCommand =
  | { type: 'insert'; text: string; caret: number }
  | { type: 'backspace' }
  | { type: 'move'; by: -1 | 1 }

export type KeyboardUpdate = { type: 'tab'; tab: TabId } | { type: 'key'; action: KeyAction }

export const initialKeyboardState: KeyboardState = { tab: 'numeric', alpha: 'latin', shift: false, accent: false }

const ACCENT = '´'
const ACCENTED_VOWELS: Record<string, string> = {
  a: 'á',
  e: 'é',
  i: 'í',
  o: 'ó',
  u: 'ú',
  A: 'Á',
  E: 'É',
  I: 'Í',
  O: 'Ó',
  U: 'Ú',
}

// A pending accent goes on the next vowel; before anything else it is written as the accent itself.
function withAccent(text: string, accent: boolean): string {
  if (!accent) {
    return text
  }
  return ACCENTED_VOWELS[text] ?? `${ACCENT}${text}`
}

export function editCommandFor(state: KeyboardState, action: KeyAction): EditCommand | null {
  switch (action.kind) {
    case 'text': {
      const text = state.accent ? `${ACCENT}${action.text}` : action.text
      return { type: 'insert', text, caret: state.accent ? action.caret + ACCENT.length : action.caret }
    }
    case 'letter': {
      const text = withAccent(state.shift ? action.upper : action.lower, state.accent)
      return { type: 'insert', text, caret: text.length }
    }
    case 'backspace':
      return { type: 'backspace' }
    case 'move':
      return { type: 'move', by: action.by }
    default:
      return null
  }
}

// Applies a command to `value` with the selection [start, end).
export function applyEditCommand(command: EditCommand, value: string, start: number, end: number): TextEdit {
  switch (command.type) {
    case 'insert':
      return insertText(value, start, end, command.text, command.caret)
    case 'backspace':
      return deleteBackward(value, start, end)
    case 'move':
      return moveCursor(value, start, end, command.by)
  }
}

function afterKey(state: KeyboardState, action: KeyAction): KeyboardState {
  switch (action.kind) {
    case 'text':
      return state.accent ? { ...state, accent: false } : state
    case 'letter':
      return { ...state, shift: false, accent: false }
    case 'shift':
      return { ...state, shift: !state.shift }
    case 'accent':
      return { ...state, accent: !state.accent }
    case 'layout':
      return { ...state, alpha: action.to }
    default:
      return state
  }
}

export function keyboardReducer(state: KeyboardState, update: KeyboardUpdate): KeyboardState {
  if (update.type === 'key') {
    return afterKey(state, update.action)
  }

  // The ABC tab always opens on the Latin layout; choosing it again keeps the layout in use.
  const alpha = update.tab === 'letters' && state.tab !== 'letters' ? 'latin' : state.alpha
  return { ...state, tab: update.tab, alpha }
}
