'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { updateCard } from '@/app/boards/actions'

interface EditableTitleProps {
    cardId: string
    boardId: string
    initialTitle: string
}

export function EditableTitle({ cardId, boardId, initialTitle }: EditableTitleProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(initialTitle)
    const [tempTitle, setTempTitle] = useState(initialTitle)
    const [isSaving, setIsSaving] = useState(false)

    async function handleSave() {
        if (!tempTitle.trim() || tempTitle === title) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            await updateCard(boardId, cardId, { title: tempTitle })
            setTitle(tempTitle)
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to update title", error)
        } finally {
            setIsSaving(false)
        }
    }

    function handleCancel() {
        setTempTitle(title)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 mb-4">
                <Input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="text-3xl font-bold h-12 px-2"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') handleCancel()
                    }}
                />
                <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    <Check className="h-6 w-6" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isSaving} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <X className="h-6 w-6" />
                </Button>
            </div>
        )
    }

    return (
        <h1
            onClick={() => setIsEditing(true)}
            className="text-3xl font-bold text-slate-900 mb-4 leading-tight cursor-pointer hover:bg-slate-100 rounded px-1 -mx-1 transition-colors border border-transparent hover:border-slate-200"
        >
            {title}
        </h1>
    )
}
