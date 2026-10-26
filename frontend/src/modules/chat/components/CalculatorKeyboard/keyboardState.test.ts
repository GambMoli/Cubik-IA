import { describe, expect, it } from 'vitest'

import { editCommandFor, initialKeyboardState, keyboardReducer } from './keyboardState'
import type { EditCommand, KeyboardState } from './keyboardState'
import type { KeyAction } from './layouts'

const letter = (lower: string, upper: string = lower.toUpperCase()): KeyAction => ({ kind: 'letter', lower, upper })
const text = (value: string, caret: number = value.length): KeyAction => ({ kind: 'text', text: value, caret })
const SHIFT: KeyAction = { kind: 'shift' }
const ACCENT: KeyAction = { kind: 'accent' }

// Presses the keys in order and returns what was written plus the final state.
function press(actions: KeyAction[], start: KeyboardState = initialKeyboardState) {
  let state = start
  const commands: EditCommand[] = []

  for (const action of actions) {
    const command = editCommandFor(state, action)
    if (command) {
      commands.push(command)
    }
    state = keyboardReducer(state, { type: 'key', action })
  }

  return { state, commands, written: commands.map((command) => (command.type === 'insert' ? command.text : '')).join('') }
}

describe('initial state', () => {
  it('opens on the 123 tab, Latin layout, with shift and accent off', () => {
    expect(initialKeyboardState).toEqual({ tab: 'numeric', alpha: 'latin', shift: false, accent: false })
  })
})

describe('writing keys', () => {
  it('turns a text key into an insert with its cursor offset', () => {
    expect(editCommandFor(initialKeyboardState, text('sqrt()', 5))).toEqual({ type: 'insert', text: 'sqrt()', caret: 5 })
  })

  it('turns a letter key into an insert of its lowercase form', () => {
    expect(editCommandFor(initialKeyboardState, letter('q'))).toEqual({ type: 'insert', text: 'q', caret: 1 })
  })

  it('turns backspace and the cursor keys into commands', () => {
    expect(editCommandFor(initialKeyboardState, { kind: 'backspace' })).toEqual({ type: 'backspace' })
    expect(editCommandFor(initialKeyboardState, { kind: 'move', by: -1 })).toEqual({ type: 'move', by: -1 })
    expect(editCommandFor(initialKeyboardState, { kind: 'move', by: 1 })).toEqual({ type: 'move', by: 1 })
  })

  it('writes nothing for shift, accent and layout keys', () => {
    for (const action of [SHIFT, ACCENT, { kind: 'layout', to: 'greek' } as const]) {
      expect(editCommandFor(initialKeyboardState, action)).toBeNull()
    }
  })
})

describe('shift', () => {
  it('capitalizes only the next letter and then turns off', () => {
    const { written, state } = press([SHIFT, letter('a'), letter('b')])

    expect(written).toBe('Ab')
    expect(state.shift).toBe(false)
  })

  it('is on after one press and off after two', () => {
    expect(press([SHIFT]).state.shift).toBe(true)
    expect(press([SHIFT, SHIFT]).state.shift).toBe(false)
  })

  it('writes a lowercase letter after being pressed twice', () => {
    expect(press([SHIFT, SHIFT, letter('a')]).written).toBe('a')
  })

  it('waits for a letter and is not used up by a digit', () => {
    const { written, state } = press([SHIFT, text('7'), letter('a')])

    expect(written).toBe('7A')
    expect(state.shift).toBe(false)
  })

  it('writes the capital form of a Greek letter', () => {
    expect(press([SHIFT, letter('θ', 'Θ')]).written).toBe('Θ')
    expect(press([SHIFT, letter('ς', 'Σ')]).written).toBe('Σ')
    expect(press([letter('θ', 'Θ')]).written).toBe('θ')
  })
})

describe('accent', () => {
  it('goes on a vowel', () => {
    const { written, state } = press([ACCENT, letter('e')])

    expect(written).toBe('é')
    expect(state.accent).toBe(false)
  })

  it('goes on every vowel', () => {
    expect(press([ACCENT, letter('a'), ACCENT, letter('e'), ACCENT, letter('i'), ACCENT, letter('o'), ACCENT, letter('u')]).written).toBe(
      'áéíóú',
    )
  })

  it('goes on a capital vowel whichever of shift and accent is pressed first', () => {
    expect(press([ACCENT, SHIFT, letter('a')]).written).toBe('Á')
    expect(press([SHIFT, ACCENT, letter('a')]).written).toBe('Á')
  })

  it('is written as itself before a consonant', () => {
    expect(press([ACCENT, letter('b')]).written).toBe('´b')
  })

  it('is written as itself before a letter that is not a Latin vowel, such as ï', () => {
    expect(press([ACCENT, letter('ï', 'Ï')]).written).toBe('´ï')
  })

  it('is written before any key that writes text and then cleared', () => {
    const { commands, state } = press([ACCENT, text('7')])

    expect(commands).toEqual([{ type: 'insert', text: '´7', caret: 2 }])
    expect(state.accent).toBe(false)
    expect(press([ACCENT, text('7'), letter('e')]).written).toBe('´7e')
  })

  it('keeps the cursor offset of a template after the accent character', () => {
    expect(press([ACCENT, text('sqrt()', 5)]).commands).toEqual([{ type: 'insert', text: '´sqrt()', caret: 6 }])
  })

  it('is off after pressing it twice', () => {
    expect(press([ACCENT, ACCENT, letter('e')]).written).toBe('e')
  })
})

describe('Latin and Greek layouts', () => {
  it('switches to the Greek layout and back without leaving the ABC tab', () => {
    const letters = keyboardReducer(initialKeyboardState, { type: 'tab', tab: 'letters' })
    const greek = keyboardReducer(letters, { type: 'key', action: { kind: 'layout', to: 'greek' } })
    const latin = keyboardReducer(greek, { type: 'key', action: { kind: 'layout', to: 'latin' } })

    expect(greek).toMatchObject({ tab: 'letters', alpha: 'greek' })
    expect(latin).toMatchObject({ tab: 'letters', alpha: 'latin' })
  })

  it('opens the ABC tab on Latin even if Greek was used before', () => {
    const letters = keyboardReducer(initialKeyboardState, { type: 'tab', tab: 'letters' })
    const greek = keyboardReducer(letters, { type: 'key', action: { kind: 'layout', to: 'greek' } })
    const away = keyboardReducer(greek, { type: 'tab', tab: 'symbols' })
    const back = keyboardReducer(away, { type: 'tab', tab: 'letters' })

    expect(back).toMatchObject({ tab: 'letters', alpha: 'latin' })
  })

  it('keeps the Greek layout when the ABC tab is chosen while it is already open', () => {
    const letters = keyboardReducer(initialKeyboardState, { type: 'tab', tab: 'letters' })
    const greek = keyboardReducer(letters, { type: 'key', action: { kind: 'layout', to: 'greek' } })

    expect(keyboardReducer(greek, { type: 'tab', tab: 'letters' }).alpha).toBe('greek')
  })
})

describe('tabs', () => {
  it('changes the selected tab and nothing else', () => {
    const state = keyboardReducer({ ...initialKeyboardState, shift: true }, { type: 'tab', tab: 'functions' })

    expect(state).toEqual({ tab: 'functions', alpha: 'latin', shift: true, accent: false })
  })

  it('does not change the state for backspace and cursor keys', () => {
    expect(press([{ kind: 'backspace' }, { kind: 'move', by: 1 }]).state).toEqual(initialKeyboardState)
  })
})
