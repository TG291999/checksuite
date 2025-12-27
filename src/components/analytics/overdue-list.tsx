'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import { CalendarClock } from "lucide-react"
import Link from "next/link"

interface OverdueListProps {
    items: {
        id: string
        title: string
        due_date: string
        assigned_to_email: string | null
        board_name: string
    }[]
}

export function OverdueList({ items }: OverdueListProps) {
    if (items.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Überfällige Vorgänge</CardTitle>
                    <CardDescription>Alles im grünen Bereich!</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                        <CalendarClock className="h-10 w-10 mb-2 opacity-20" />
                        <p>Keine überfälligen Aufgaben.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Überfällige Vorgänge</CardTitle>
                <CardDescription>Diese Aufgaben erfordern Aufmerksamkeit.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.slice(0, 5).map(item => (
                        <div key={item.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-red-100 text-red-700 text-xs">
                                        {item.assigned_to_email?.[0]?.toUpperCase() || '!'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate text-slate-900">{item.title}</p>
                                    <p className="text-xs text-slate-500 truncate">
                                        {item.board_name} • {item.assigned_to_email || 'Nicht zugewiesen'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded whitespace-nowrap">
                                {format(new Date(item.due_date), "dd.MM.")}
                            </div>
                        </div>
                    ))}
                    {items.length > 5 && (
                        <div className="pt-2 text-center">
                            <span className="text-xs text-slate-500">
                                +{items.length - 5} weitere
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
