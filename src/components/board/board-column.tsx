'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCard } from '@/app/boards/actions'
import { Plus, Check, X, Trash2 } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DraggableCard } from './draggable-card'

// Types (mirrors what we pass from the server page)
interface CardData {
    id: string
    title: string
    description: string | null
    position: number
}

interface ColumnData {
    id: string
    name: string
    position: number
    cards: CardData[]
}

interface BoardColumnProps {
    column: ColumnData
    boardId: string
    isOverlay?: boolean
}

export function BoardColumn({ column, boardId, isOverlay }: BoardColumnProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const { setNodeRef } = useDroppable({
        id: column.id,
    })

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus()
        }
    }, [isEditing])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const trimmedTitle = title.trim()
        if (!trimmedTitle) return

        setIsSaving(true)
        try {
            await createCard(boardId, column.id, trimmedTitle)
            setTitle('')
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to create card', error)
        } finally {
            setIsSaving(false)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Escape') {
            setIsEditing(false)
        }
    }

    if (isOverlay) {
        return (
            <div className="flex h-full w-80 shrink-0 flex-col rounded-lg bg-slate-100/50 border border-slate-200/60 p-3 opacity-60">
                <div className="mb-3 flex items-center justify-between px-1">
                    <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">{column.name}</h3>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">{column.cards.length}</span>
                </div>
                <div className="flex flex-col gap-3 pb-4">
                    {column.cards.map(card => <DraggableCard key={card.id} card={card} boardId={boardId} />)}
                </div>
            </div>
        )
    }

    return (
        <div ref={setNodeRef} className="flex h-full w-80 shrink-0 flex-col rounded-lg bg-slate-100/50 border border-slate-200/60 p-3">
            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between px-1 group">
                <EditableColumnHeader
                    columnId={column.id}
                    boardId={boardId}
                    initialName={column.name}
                />
                <div className="flex items-center gap-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                        {column.cards.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={async () => {
                            if (confirm(`Spalte "${column.name}" wirklich löschen? Alle Karten in dieser Spalte werden ebenfalls gelöscht.`)) {
                                try {
                                    await import('@/app/boards/actions').then(mod => mod.deleteColumn(boardId, column.id))
                                } catch (error) {
                                    console.error('Failed to delete column', error)
                                }
                            }
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto pr-1">
                <SortableContext items={column.cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3 pb-4">
                        {column.cards.map((card) => (
                            <DraggableCard
                                key={card.id}
                                card={card}
                                boardId={boardId}
                            />
                        ))}

                        {/* Inline Create Form */}
                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-lg border border-slate-300 bg-white p-3 shadow-sm">
                                <Input
                                    ref={inputRef}
                                    placeholder="Titel eingeben..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isSaving}
                                    className="h-8 text-sm"
                                />
                                <div className="flex items-center gap-2">
                                    <Button type="submit" size="sm" className="h-7 px-3 text-xs" disabled={isSaving || !title.trim()}>
                                        {isSaving ? '...' : 'Speichern'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isSaving}
                                    >
                                        Abbrechen
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <Button
                                variant="ghost"
                                className="flex h-9 w-full items-center justify-start gap-2 px-2 text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
                                onClick={() => setIsEditing(true)}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="text-sm">Vorgang</span>
                            </Button>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}

function EditableColumnHeader({ columnId, boardId, initialName }: { columnId: string, boardId: string, initialName: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(initialName)
    const [tempName, setTempName] = useState(initialName)
    const [isSaving, setIsSaving] = useState(false)

    // Sync if props change (optimistic updates)
    if (!isEditing && name !== initialName) {
        setName(initialName)
        setTempName(initialName)
    }

    async function handleSave() {
        if (!tempName.trim() || tempName === name) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            await import('@/app/boards/actions').then(mod => mod.updateColumn(boardId, columnId, tempName))
            setName(tempName)
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to update column", error)
        } finally {
            setIsSaving(false)
        }
    }

    function handleCancel() {
        setTempName(name)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1 flex-1 pointer-events-auto">
                <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="h-7 text-sm font-semibold px-2"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') handleCancel()
                    }}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={handleSave} disabled={isSaving}>
                    <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={handleCancel} disabled={isSaving}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <h3
            onClick={() => setIsEditing(true)}
            className="font-semibold text-slate-700 text-sm uppercase tracking-wider cursor-pointer hover:bg-slate-200/50 rounded px-1 -mx-1 transition-colors truncate flex-1"
        >
            {name}
        </h3>
    )
}
