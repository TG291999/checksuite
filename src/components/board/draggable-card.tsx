'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, isPast, isTomorrow, isToday } from 'date-fns'
import { CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface ChecklistItem {
    id: string
    is_completed: boolean
    is_mandatory?: boolean
}

interface CardData {
    id: string
    title: string
    description: string | null
    position: number
    due_date?: string | null
    checklist_items?: ChecklistItem[]
}

interface DraggableCardProps {
    card: CardData
    boardId: string // Add boardId prop
}

export function DraggableCard({ card, boardId }: DraggableCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: {
            type: 'Card',
            card,
        },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    }

    const completedCount = card.checklist_items?.filter(i => i.is_completed).length || 0
    const totalCount = card.checklist_items?.length || 0

    // Date Logic
    let dateColorClass = "text-slate-500 bg-slate-100"
    if (card.due_date) {
        const date = new Date(card.due_date)
        if (isPast(date) && !isToday(date)) {
            dateColorClass = "text-red-700 bg-red-100 border-red-200"
        } else if (isToday(date) || isTomorrow(date)) {
            dateColorClass = "text-orange-700 bg-orange-100 border-orange-200"
        }
    }

    // Move Link INSIDE the drag handle div, but only wrapping the content if not dragging?
    // Actually, dnd-kit recommends the drag handle be on the element.
    // If we put a Link inside, clicking it navigates. Dragging it (holding) drags.
    // However, sometimes Link interferes with Drag.
    // Better pattern: The whole card is the drag handle.
    // But we need to distinguish click vs drag. dnd-kit's sensors usually handle this (distance: 3).

    // Note: Wrapping with Link can be tricky with dnd-kit ref.
    // Best practice: Ref goes on a wrapper <div>. Link goes inside <div>.
    // listeners/attributes go on the wrapper (making it the handle).

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Link href={`/boards/${boardId}/cards/${card.id}`} className="block">
                <Card className="cursor-pointer border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300 active:cursor-grabbing group">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm font-medium leading-snug text-slate-800 group-hover:text-blue-600 transition-colors">
                            {card.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                        {card.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">
                                {card.description}
                            </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                            {card.due_date && (
                                <div className={cn("flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border border-transparent", dateColorClass)}>
                                    <CalendarClock className="h-3 w-3" />
                                    {format(new Date(card.due_date), "dd.MM")}
                                </div>
                            )}

                            {totalCount > 0 && (
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 ml-auto">
                                    <span className={completedCount === totalCount ? "text-green-600" : ""}>
                                        {completedCount}/{totalCount}
                                    </span>
                                    <div className="h-1 w-8 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${completedCount === totalCount ? 'bg-green-500' : 'bg-blue-400'}`}
                                            style={{ width: `${(completedCount / totalCount) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}
