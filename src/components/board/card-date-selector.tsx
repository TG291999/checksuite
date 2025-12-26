'use client'

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

interface CardDateSelectorProps {
    boardId: string
    cardId: string
    initialDate?: string | null
}

export function CardDateSelector({ boardId, cardId, initialDate }: CardDateSelectorProps) {
    const [dateOpen, setDateOpen] = useState(false)
    const [currentDate, setCurrentDate] = useState<Date | undefined>(
        initialDate ? new Date(initialDate) : undefined
    )

    async function handleDateSelect(date: Date | undefined) {
        setDateOpen(false)
        setCurrentDate(date) // Optimistic update
        await updateCard(boardId, cardId, { due_date: date ? date.toISOString() : null })
    }

    return (
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !currentDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentDate ? format(currentDate, "PPP") : <span>Datum wählen</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={handleDateSelect}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}
