'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface TaskItem {
    id: string
    title: string
    board_id: string
    board_name: string
    column_name: string
    due_date: string | null
}

interface TaskListProps {
    title: string
    description: string
    tasks: TaskItem[]
    variant?: 'default' | 'warning'
    emptyMessage?: string
    icon?: React.ReactNode
}

export function TaskList({
    title,
    description,
    tasks,
    variant = 'default',
    emptyMessage = 'Keine Vorgänge',
    icon
}: TaskListProps) {
    const isWarning = variant === 'warning'

    return (
        <Card className={isWarning && tasks.length > 0 ? 'border-red-200 bg-red-50/30' : ''}>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <CardTitle className={`text-lg ${isWarning && tasks.length > 0 ? 'text-red-700' : ''}`}>
                        {title}
                        {tasks.length > 0 && (
                            <Badge
                                variant={isWarning ? 'destructive' : 'secondary'}
                                className="ml-2"
                            >
                                {tasks.length}
                            </Badge>
                        )}
                    </CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {emptyMessage}
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {tasks.map((task) => (
                            <li key={task.id}>
                                <Link
                                    href={`/boards/${task.board_id}/cards/${task.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 transition-colors group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                            {task.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground truncate">
                                                {task.board_name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">•</span>
                                            <Badge variant="outline" className="text-xs h-5">
                                                {task.column_name}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        {task.due_date && (
                                            <span className={`text-xs ${isWarning ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                                {formatDistanceToNow(new Date(task.due_date), {
                                                    addSuffix: true,
                                                    locale: de
                                                })}
                                            </span>
                                        )}
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
