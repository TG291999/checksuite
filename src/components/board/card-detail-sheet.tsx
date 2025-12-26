'use client'

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { ChecklistManager } from './checklist-manager'

import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { updateCard } from '@/app/boards/actions'
import { useState } from 'react'

interface ChecklistItem {
    id: string
    content: string
    is_completed: boolean
}

interface CardData {
    id: string
    title: string
    description: string | null
    position: number
    due_date?: string | null
    checklist_items: ChecklistItem[]
}

interface CardDetailSheetProps {
    card: CardData | null
    isOpen: boolean
    onClose: () => void
    boardId: string
}

export function CardDetailSheet({ card, isOpen, onClose, boardId }: CardDetailSheetProps) {
    const [dateOpen, setDateOpen] = useState(false)

    if (!card) return null

    async function handleDateSelect(date: Date | undefined) {
        if (!card) return
        setDateOpen(false)
        await updateCard(boardId, card.id, { due_date: date ? date.toISOString() : null })
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl">{card.title}</SheetTitle>
                    {card.description && (
                        <SheetDescription className="text-base text-slate-600 mt-2">
                            {card.description}
                        </SheetDescription>
                    )}
                </SheetHeader>

                <div className="mb-6">
                    <h4 className="mb-2 text-sm font-medium text-slate-900">Fälligkeitsdatum</h4>
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[240px] justify-start text-left font-normal",
                                    !card.due_date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {card.due_date ? format(new Date(card.due_date), "PPP") : <span>Datum wählen</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={card.due_date ? new Date(card.due_date) : undefined}
                                onSelect={handleDateSelect}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="py-2">
                    <ChecklistManager
                        cardId={card.id}
                        boardId={boardId}
                        items={card.checklist_items || []}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
