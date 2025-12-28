'use client'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { MoreHorizontal, Calendar as CalendarIcon, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PriorityBadge } from './priority-badge'
import { updateTaskDueDate, updateTaskPriority } from '@/app/dashboard/actions'
import { cn } from '@/lib/utils'

interface DashboardCardItemProps {
    task: any
}

export function DashboardCardItem({ task }: DashboardCardItemProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    async function handlePriorityChange(priority: string) {
        setIsUpdating(true)
        await updateTaskPriority(task.id, priority)
        setIsUpdating(false)
    }

    async function handleDateSelect(date: Date | undefined) {
        setIsUpdating(true)
        await updateTaskDueDate(task.id, date ? date.toISOString() : null)
        setIsUpdating(false)
    }

    return (
        <div className={cn("group flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md", isUpdating && "opacity-50")}>
            <div className="flex flex-col gap-1 overflow-hidden">
                <div className="flex items-center gap-2">
                    {/* Interactive Priority Badge */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
                                <PriorityBadge priority={task.priority} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Priorität ändern</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handlePriorityChange('high')}>
                                Hoch
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePriorityChange('normal')}>
                                Normal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePriorityChange('low')}>
                                Niedrig
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href={`/boards/${task.boards.id}/cards/${task.id}`} className="truncate font-medium text-slate-900 hover:underline">
                        {task.title}
                    </Link>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="truncate max-w-[100px]">{task.boards.name}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{task.columns.name}</span>
                    {task.due_date && (
                        <>
                            <span className="mx-1">•</span>
                            <span className={cn(
                                new Date(task.due_date) < new Date() ? "text-red-600 font-medium" : ""
                            )}>
                                {format(new Date(task.due_date), 'dd. MMM', { locale: de })}
                            </span>
                        </>
                    )}
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Aktionen</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/boards/${task.boards.id}/cards/${task.id}`}>
                            Öffnen
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Priorität ändern</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handlePriorityChange('high')}>
                                Hoch
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePriorityChange('normal')}>
                                Normal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePriorityChange('low')}>
                                Niedrig
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Fälligkeit ändern</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="p-0">
                            <Calendar
                                mode="single"
                                selected={task.due_date ? new Date(task.due_date) : undefined}
                                onSelect={handleDateSelect}
                                initialFocus
                            />
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
