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
    assigned_to?: string | null
    checklist_items?: ChecklistItem[]
    card_participants?: { user_id: string }[]
}

interface DraggableCardProps {
    card: CardData
    boardId: string
    isReadOnly?: boolean
    workspaceMembers?: { id: string, email: string }[]
}

export function DraggableCard({ card, boardId, isReadOnly = false, workspaceMembers = [] }: DraggableCardProps) {
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
        disabled: isReadOnly,
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

    const content = (
        <Card className={`border-slate-200 shadow-sm transition-all group ${!isReadOnly ? 'cursor-pointer hover:shadow-md hover:border-slate-300 active:cursor-grabbing' : ''}`}>
            <CardHeader className="p-3 pb-1">
                <CardTitle className={`text-sm font-medium leading-snug text-slate-800 ${!isReadOnly ? 'group-hover:text-blue-600' : ''} transition-colors`}>
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

                {/* Footer: Assignee & Participants */}
                <div className="flex items-center justify-between mt-2">
                    {/* Primary Assignee */}
                    {card.assigned_to ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 ring-2 ring-white" title={workspaceMembers.find(m => m.id === card.assigned_to)?.email}>
                            {workspaceMembers.find(m => m.id === card.assigned_to)?.email?.[0]?.toUpperCase() || '?'}
                        </div>
                    ) : (
                        <div /> // Spacer
                    )}

                    {/* Participants Avatars */}
                    {card.card_participants && card.card_participants.length > 0 && (
                        <div className="flex -space-x-1.5 overflow-hidden">
                            {card.card_participants.map(p => {
                                // Don't show assignee twice if they are also in participants (though DB allows it, UI should dedup?)
                                // For now just show all.
                                const member = workspaceMembers.find(m => m.id === p.user_id)
                                const initial = member?.email?.[0]?.toUpperCase() || '?'
                                return (
                                    <div key={p.user_id} className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 ring-2 ring-white text-[9px] font-medium text-indigo-700" title={member?.email}>
                                        {initial}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    if (isReadOnly) {
        return (
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                {content}
            </div>
        )
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Link href={`/boards/${boardId}/cards/${card.id}`} className="block">
                {content}
            </Link>
        </div>
    )
}
