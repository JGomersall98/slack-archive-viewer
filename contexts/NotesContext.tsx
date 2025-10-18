'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface NotesContextType {
  editingMessageId: string | null
  setEditingMessageId: (messageId: string | null) => void
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

export function NotesProvider({ children }: { children: ReactNode }) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

  return (
    <NotesContext.Provider value={{ editingMessageId, setEditingMessageId }}>
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
}