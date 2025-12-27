'use client'

import { useState, useRef, useMemo } from 'react'
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    closestCorners,
    defaultDropAnimationSideEffects,
    DropAnimation,
} from '@dnd-kit/core'
import {
    horizontalListSortingStrategy,
    SortableContext,
    arrayMove,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { createColumn, moveCard } from '@/app/boards/actions'
import { BoardColumn } from './board-column'
import { DraggableCard } from './draggable-card'

// Types
interface ChecklistItem {
    id: string
    content: string
    is_completed: boolean
    is_mandatory: boolean
}

interface CardData {
    id: string
    title: string
    description: string | null
    position: number
    checklist_items?: ChecklistItem[]
    card_participants: { user_id: string }[]
    assigned_to?: string | null // Added for filtering
}

interface Member {
    id: string
    email: string
}

interface ColumnData {
    id: string
    name: string
    position: number
    cards: CardData[]
}

interface BoardCanvasProps {
    initialColumns: ColumnData[]
    boardId: string
    isReadOnly?: boolean
    workspaceMembers?: Member[]
    currentUserId?: string
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export function BoardCanvas({ initialColumns, boardId, isReadOnly = false, workspaceMembers = [], currentUserId }: BoardCanvasProps) {
    const [columns, setColumns] = useState<ColumnData[]>(initialColumns)
    const [activeDragCard, setActiveDragCard] = useState<CardData | null>(null)
    const [filter, setFilter] = useState<'all' | 'assigned' | 'participating'>('all')

    const filteredColumns = useMemo(() => {
        if (filter === 'all' || !currentUserId) return columns

        return columns.map(col => ({
            ...col,
            cards: col.cards.filter(card => {
                if (filter === 'assigned') {
                    return card.assigned_to === currentUserId
                }
                if (filter === 'participating') {
                    return card.card_participants?.some(p => p.user_id === currentUserId)
                }
                return true
            })
        }))
    }, [columns, filter, currentUserId])

    // Sync state with server data (fixes revalidation issue)
    // Removed useEffect for initialColumns sync as per instruction, relying on useMemo for filtering.
    // If initialColumns can change independently of filtering, a useEffect might still be needed for `setColumns(initialColumns)`.
    // For now, following the instruction to remove it.

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3, // Prevent accidental drags
            },
        })
    )

    function findColumn(id: string | null) {
        if (!id) return null
        return columns.find((c) => c.cards.some((card) => card.id === id) || c.id === id)
    }

    function handleDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === 'Card') {
            setActiveDragCard(event.active.data.current.card)
        }
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        // Find the columns
        const activeColumn = findColumn(activeId as string)
        const overColumn = findColumn(overId as string)

        if (!activeColumn || !overColumn) return

        if (activeColumn !== overColumn) {
            // Check for mandatory items before allowing optimistic move across columns
            const activeCard = activeColumn.cards.find(c => c.id === activeId)
            if (activeCard?.checklist_items?.some(i => i.is_mandatory && !i.is_completed)) {
                // Determine if we should block.
                // UX decision: Block visual drag-over or just show error on drop?
                // Blocking drag-over visual prevents the card from entering the new column entirely.
                return
            }

            setColumns((prev) => {
                const activeColIndex = prev.findIndex((c) => c.id === activeColumn.id)
                const overColIndex = prev.findIndex((c) => c.id === overColumn.id)

                const activeCards = prev[activeColIndex].cards
                const overCards = prev[overColIndex].cards

                const activeCardIndex = activeCards.findIndex((c) => c.id === activeId)
                const overCardIndex = overCards.findIndex((c) => c.id === overId)

                let newIndex: number
                if (overCardIndex >= 0) {
                    // We are over another card in the target column
                    // If we are below the over card, we want to be after it
                    // (This logic can be refined, often dnd-kit provides good defaults)
                    newIndex = overCardIndex
                } else {
                    // We are over the column itself (empty or at end)
                    newIndex = overCards.length + 1
                }

                return prev.map((c) => {
                    if (c.id === activeColumn.id) {
                        return {
                            ...c,
                            cards: activeCards.filter((card) => card.id !== activeId),
                        }
                    }
                    if (c.id === overColumn.id) {
                        // Insert the card into the new column
                        const newCard = { ...activeCards[activeCardIndex] } // Clone

                        const newCards = [
                            ...overCards.slice(0, newIndex),
                            newCard,
                            ...overCards.slice(newIndex, overCards.length)
                        ]

                        return {
                            ...c,
                            cards: newCards
                        }
                    }
                    return c
                })
            })
        }
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveDragCard(null)

        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        const activeColumn = findColumn(activeId)
        const overColumn = findColumn(overId)

        if (!activeColumn || !overColumn) return

        const activeColIndex = columns.findIndex(c => c.id === activeColumn.id)
        const overColIndex = columns.findIndex(c => c.id === overColumn.id)

        if (activeColumn === overColumn) {
            // Reordering within same column
            const cardIndex = activeColumn.cards.findIndex(c => c.id === activeId)
            const overIndex = activeColumn.cards.findIndex(c => c.id === overId)

            if (cardIndex !== overIndex) {
                const newCards = arrayMove(activeColumn.cards, cardIndex, overIndex)

                // Update local state
                setColumns(prev => {
                    const next = [...prev]
                    next[activeColIndex] = { ...activeColumn, cards: newCards }
                    return next
                })

                // Trigger Server Action
                // For MVP, simply update the moved card's position to the new index
                await moveCard(boardId, activeId, activeColumn.id, overIndex)
            }
        } else {
            // Moved to different column

            // Validation: Check for mandatory items
            const cardInNewCol = columns[overColIndex].cards.find(c => c.id === activeId)
            // Note: cardInNewCol might be the optimistic version from DragOver.
            // Better to rely on the activeDragCard state or find it in initial state?
            // Actually, we can check the card itself.
            const cardToCheck = activeDragCard || activeColumn.cards.find(c => c.id === activeId)

            if (cardToCheck?.checklist_items?.some(i => i.is_mandatory && !i.is_completed)) {
                // Logic to revert:
                // Since handleDragOver already optimistically moved it, we need to revert 'columns' state to 'initialColumns'
                // or just previous valid state.
                // But handleDragOver runs continuously.
                // Easiest is to trigger a re-render/revert or alert.

                alert("Bitte alle Pflicht-Felder der Checkliste erledigen, bevor du die Karte verschiebst!")
                setColumns(initialColumns) // Revert visual state
                return
            }

            // We need to persist the final state
            const overCards = columns[overColIndex].cards
            const newIndex = overCards.findIndex(c => c.id === activeId)

            // If valid, proceed
            await moveCard(boardId, activeId, overColumn.id, newIndex)
        }
    }

    return (
        <div className="flex h-full flex-col">
            {currentUserId && !isReadOnly && (
                <div className="px-4 mb-2 flex justify-end gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'secondary'}
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => setFilter('all')}
                    >
                        Alle
                    </Button>
                    <Button
                        variant={filter === 'assigned' ? 'default' : 'secondary'}
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => setFilter('assigned')}
                    >
                        Meine Aufgaben
                    </Button>
                    <Button
                        variant={filter === 'participating' ? 'default' : 'secondary'}
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => setFilter('participating')}
                    >
                        Dabei
                    </Button>
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex h-full gap-4 overflow-x-auto pb-4 px-2">
                    <SortableContext items={filteredColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                        {filteredColumns.map((column) => (
                            <BoardColumn
                                key={column.id}
                                column={column}
                                boardId={boardId}
                                isOverlay={false}
                                isReadOnly={filter !== 'all' || isReadOnly} // Disable D&D when filtered
                                workspaceMembers={workspaceMembers}
                            />
                        ))}
                    </SortableContext>
                    {!isReadOnly && <CreateColumnButton boardId={boardId} />}
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeDragCard ? (
                        <DraggableCard card={activeDragCard} boardId={boardId} isReadOnly={true} workspaceMembers={workspaceMembers} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}

function CreateColumnButton({ boardId }: { boardId: string }) {
    const [isCreating, setIsCreating] = useState(false)
    const [name, setName] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        setIsSaving(true)
        try {
            await import('@/app/boards/actions').then(mod => mod.createColumn(boardId, name))
            setName('')
            setIsCreating(false)
        } catch (error) {
            console.error("Failed to create column", error)
        } finally {
            setIsSaving(false)
        }
    }

    if (isCreating) {
        return (
            <div className="flex h-min w-80 shrink-0 flex-col rounded-lg bg-slate-100 p-3 border border-slate-200 shadow-sm">
                <form onSubmit={handleCreate} className="space-y-2">
                    <input
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 bg-white"
                        placeholder="Spaltenname..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-8 px-3"
                        >
                            Hinzufügen
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCreating(false)}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-200 h-8 px-3 text-slate-600"
                        >
                            <span className="sr-only">Abbrechen</span>
                            <span aria-hidden>✕</span>
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div
            onClick={() => setIsCreating(true)}
            className="flex h-12 w-80 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors"
        >
            + Spalte hinzufügen
        </div>
    )
}
