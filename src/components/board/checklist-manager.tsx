'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Trash2, Plus, Check, X } from 'lucide-react'
import { addChecklistItem, toggleChecklistItem, deleteChecklistItem, updateChecklistItem } from '@/app/boards/actions'

interface ChecklistItem {
    id: string
    content: string
    is_completed: boolean
}

interface ChecklistManagerProps {
    cardId: string
    boardId: string
    items: ChecklistItem[]
}

// Sub-component for individual editable items
function ChecklistItemRow({ item, boardId }: { item: ChecklistItem, boardId: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [content, setContent] = useState(item.content)
    const [tempContent, setTempContent] = useState(item.content)
    const [isSaving, setIsSaving] = useState(false)

    // Sync content if props change (optimistic updates from parent re-render)
    if (!isEditing && content !== item.content) {
        setContent(item.content)
        setTempContent(item.content)
    }

    async function handleSave() {
        if (!tempContent.trim() || tempContent === content) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            await updateChecklistItem(boardId, item.id, tempContent)
            setContent(tempContent)
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to update item", error)
        } finally {
            setIsSaving(false)
        }
    }

    function handleCancel() {
        setTempContent(content)
        setIsEditing(false)
    }

    return (
        <div className="flex items-start gap-3 group min-h-[32px]">
            <Checkbox
                checked={item.is_completed}
                onCheckedChange={(checked) => toggleChecklistItem(boardId, item.id, checked as boolean)}
                className="mt-2"
                disabled={isEditing}
            />

            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <Input
                            value={tempContent}
                            onChange={(e) => setTempContent(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave()
                                if (e.key === 'Escape') handleCancel()
                            }}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={handleSave} disabled={isSaving}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={handleCancel} disabled={isSaving}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <span
                        onClick={() => setIsEditing(true)}
                        className={`text-sm block py-1.5 px-1 -ml-1 rounded border border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors ${item.is_completed ? 'text-muted-foreground line-through' : 'text-slate-700'}`}
                    >
                        {content}
                    </span>
                )}
            </div>

            {!isEditing && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => deleteChecklistItem(boardId, item.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}

export function ChecklistManager({ cardId, boardId, items }: ChecklistManagerProps) {
    const [newItemContent, setNewItemContent] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    const completedCount = items.filter((i) => i.is_completed).length
    const totalCount = items.length
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

    async function handleAddItem(e: React.FormEvent) {
        e.preventDefault()
        if (!newItemContent.trim()) return

        setIsAdding(true)
        try {
            await addChecklistItem(boardId, cardId, newItemContent)
            setNewItemContent('')
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900">Checkliste</h3>
                <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>

            <Progress value={progress} className="h-2" />

            <div className="space-y-2">
                {items.map((item) => (
                    <ChecklistItemRow key={item.id} item={item} boardId={boardId} />
                ))}
            </div>

            <form onSubmit={handleAddItem} className="flex gap-2">
                <Input
                    placeholder="Eintrag hinzufügen..."
                    value={newItemContent}
                    onChange={(e) => setNewItemContent(e.target.value)}
                    className="h-8 text-sm"
                    disabled={isAdding}
                />
                <Button type="submit" size="sm" className="h-8" disabled={isAdding || !newItemContent.trim()}>
                    <Plus className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
