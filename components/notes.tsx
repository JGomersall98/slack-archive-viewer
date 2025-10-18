'use client'

import { useState } from 'react'
import { StickyNote, Edit3, Save, X } from 'lucide-react'

interface NotesProps {
  message: any
  onNoteUpdate?: () => void
}

export default function Notes({ message, onNoteUpdate }: NotesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [noteContent, setNoteContent] = useState(message.personal_note?.content || '')
  const [isSaving, setIsSaving] = useState(false)

  const hasNote = message.personal_note?.content

  const handleSaveNote = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageTs: message.ts,
          channelId: message.channelId,
          note: noteContent.trim() || null
        })
      })

      if (response.ok) {
        setIsEditing(false)
        if (onNoteUpdate) onNoteUpdate()
      } else {
        console.error('Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setNoteContent(message.personal_note?.content || '')
    setIsEditing(false)
  }

  return (
    <div className="mt-2">
      {/* Show existing note */}
      {hasNote && !isEditing && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <StickyNote className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{message.personal_note.content}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  {message.personal_note.updated_at ? 
                    `Updated ${new Date(message.personal_note.updated_at).toLocaleDateString()}` :
                    `Created ${new Date(message.personal_note.created_at).toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
          <div className="flex items-start space-x-2 mb-2">
            <StickyNote className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Personal Note</span>
          </div>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add your personal note about this message..."
            className="w-full p-2 text-sm border border-yellow-300 dark:border-yellow-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            rows={3}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={handleSaveNote}
              disabled={isSaving}
              className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-1"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add note button */}
      {!hasNote && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400"
        >
          <StickyNote className="h-3 w-3" />
          <span>Add personal note</span>
        </button>
      )}
    </div>
  )
}