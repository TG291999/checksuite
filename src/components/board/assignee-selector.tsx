'use client'

import { useState } from 'react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, User, UserMinus } from 'lucide-react'
import { updateCard } from '@/app/boards/actions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Member {
    id: string
    email: string
}

interface AssigneeSelectorProps {
    cardId: string
    boardId: string
    assigneeId: string | null | undefined
    availableMembers: Member[]
}

export function AssigneeSelector({ cardId, boardId, assigneeId = null, availableMembers = [] }: AssigneeSelectorProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSelect(userId: string | null) {
        if (isLoading || userId === assigneeId) return
        setIsLoading(true)

        try {
            await updateCard(boardId, cardId, { assigned_to: userId })
            setOpen(false)
        } catch (error) {
            console.error('Failed to update assignee', error)
        } finally {
            setIsLoading(false)
        }
    }

    const currentAssignee = availableMembers.find(m => m.id === assigneeId)

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-900">
                    Verantwortlich
                </label>
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 w-full justify-start px-2 font-normal",
                            !currentAssignee && "text-slate-500 border-dashed"
                        )}
                    >
                        {currentAssignee ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
                                        {currentAssignee.email[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="truncate">{currentAssignee.email}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>Verantwortlichen wählen</span>
                            </div>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                    <div className="mb-2 px-2 py-1 text-xs font-medium text-slate-500">
                        Mitglied wählen
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                        <button
                            className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-100",
                                !assigneeId && "bg-slate-50 text-slate-600"
                            )}
                            onClick={() => handleSelect(null)}
                            disabled={isLoading}
                        >
                            <UserMinus className="h-4 w-4 text-slate-400" />
                            <span className="flex-1 truncate text-left text-slate-500">
                                Niemand
                            </span>
                            {!assigneeId && <Check className="h-4 w-4" />}
                        </button>

                        {availableMembers.map(member => {
                            const isSelected = member.id === assigneeId
                            return (
                                <button
                                    key={member.id}
                                    className={cn(
                                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-100",
                                        isSelected && "bg-slate-50 text-blue-700"
                                    )}
                                    onClick={() => handleSelect(member.id)}
                                    disabled={isLoading}
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-medium text-slate-600">
                                        {member.email[0].toUpperCase()}
                                    </div>
                                    <span className="flex-1 truncate text-left">
                                        {member.email}
                                    </span>
                                    {isSelected && <Check className="h-4 w-4" />}
                                </button>
                            )
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
