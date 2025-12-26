'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea' // We might need to install/ensure this exists? shadcn uses standard textarea typically or component
import { Check, X } from 'lucide-react'
import { updateCard } from '@/app/boards/actions'
import { cn } from '@/lib/utils'

interface EditableDescriptionProps {
    cardId: string
    boardId: string
    initialDescription: string | null
}

export function EditableDescription({ cardId, boardId, initialDescription }: EditableDescriptionProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [description, setDescription] = useState(initialDescription || '')
    const [tempDescription, setTempDescription] = useState(initialDescription || '')
    const [isSaving, setIsSaving] = useState(false)

    async function handleSave() {
        if (tempDescription === description) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            await updateCard(boardId, cardId, { description: tempDescription })
            setDescription(tempDescription)
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to update description", error)
        } finally {
            setIsSaving(false)
        }
    }

    function handleCancel() {
        setTempDescription(description)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="space-y-4">
                <Textarea
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    className="min-h-[150px] text-base"
                    autoFocus
                    placeholder="Füge eine detaillierte Beschreibung hinzu..."
                />
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                        <Check className="h-4 w-4" /> Speichern
                    </Button>
                    <Button onClick={handleCancel} disabled={isSaving} size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 gap-2">
                        <X className="h-4 w-4" /> Abbrechen
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                "prose prose-slate max-w-none cursor-pointer rounded-md p-2 -ml-2 border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all min-h-[4rem]",
                !description && "text-slate-400 italic bg-slate-50 border-dashed border-slate-300"
            )}
        >
            {description ? (
                <p className="whitespace-pre-wrap mt-0 mb-0">{description}</p>
            ) : (
                <p className="mt-0 mb-0">Keine Beschreibung vorhanden. Klicken zum Bearbeiten.</p>
            )}
        </div>
    )
}
