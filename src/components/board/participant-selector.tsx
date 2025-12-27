'use client'

import { useState } from 'react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, Plus, User, UserMinus } from 'lucide-react'
import { addParticipant, removeParticipant } from '@/app/boards/actions'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Member {
    id: string
    email: string
}

interface ParticipantSelectorProps {
    cardId: string
    boardId: string
    participants: { user_id: string }[]
    availableMembers: Member[]
}

export function ParticipantSelector({ cardId, boardId, participants = [], availableMembers = [] }: ParticipantSelectorProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Derived state for quick lookup
    const participantIds = new Set(participants.map(p => p.user_id))

    async function handleToggle(userId: string) {
        if (isLoading) return
        setIsLoading(true)

        try {
            if (participantIds.has(userId)) {
                await removeParticipant(boardId, cardId, userId)
            } else {
                await addParticipant(boardId, cardId, userId)
            }
        } catch (error) {
            console.error('Failed to toggle participant', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-900">
                    Beteiligte
                </label>
                <div className="text-xs text-slate-500">
                    {participants.length} Person(en)
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {participants.map(p => {
                    const member = availableMembers.find(m => m.id === p.user_id)
                    const initial = member?.email?.[0]?.toUpperCase() || '?'
                    return (
                        <div key={p.user_id} className="flex items-center gap-2 rounded-full bg-indigo-50 pl-1 pr-3 py-1 border border-indigo-100">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px]">
                                    {initial}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-indigo-900 max-w-[100px] truncate">
                                {member?.email || 'Unbekannt'}
                            </span>
                        </div>
                    )
                })}

                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8 w-8 rounded-full p-0 border-dashed border-slate-300 hover:border-slate-400 text-slate-500">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                        <div className="mb-2 px-2 py-1 text-xs font-medium text-slate-500">
                            Person hinzufügen
                        </div>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                            {availableMembers.map(member => {
                                const isSelected = participantIds.has(member.id)
                                return (
                                    <button
                                        key={member.id}
                                        className={cn(
                                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-slate-100",
                                            isSelected && "bg-slate-50 text-indigo-700"
                                        )}
                                        onClick={() => handleToggle(member.id)}
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
                            {availableMembers.length === 0 && (
                                <p className="text-xs text-slate-400 px-2 py-2 text-center">Keine weiteren Mitglieder.</p>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
