'use client'

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import { dayMarkReducer, INITIAL_STATE, type DayMarkState, type DayMarkAction } from './types'

interface DayMarkContextValue {
  state: DayMarkState
  dispatch: Dispatch<DayMarkAction>
}

const DayMarkContext = createContext<DayMarkContextValue | null>(null)

export function DayMarkProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dayMarkReducer, INITIAL_STATE)

  return (
    <DayMarkContext.Provider value={{ state, dispatch }}>
      {children}
    </DayMarkContext.Provider>
  )
}

export function useDayMark() {
  const context = useContext(DayMarkContext)
  if (!context) {
    throw new Error('useDayMark must be used within a DayMarkProvider')
  }
  return context
}
