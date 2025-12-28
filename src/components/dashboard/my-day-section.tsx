import { LucideIcon } from 'lucide-react'
import { DashboardCardItem } from './dashboard-card-item'
import { cn } from '@/lib/utils'

interface MyDaySectionProps {
    title: string
    icon: LucideIcon
    tasks: any[]
    variant?: 'default' | 'danger' | 'success'
    emptyText?: string
}

export function MyDaySection({ title, icon: Icon, tasks, variant = 'default', emptyText = 'Keine Aufgaben' }: MyDaySectionProps) {
    const hasTasks = tasks.length > 0

    return (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        variant === 'danger' && "bg-red-100 text-red-600",
                        variant === 'success' && "bg-emerald-100 text-emerald-600",
                        variant === 'default' && "bg-indigo-100 text-indigo-600",
                    )}>
                        <Icon className="h-4 w-4" />
                    </div>
                    {title && <h3 className="font-semibold text-slate-800">{title}</h3>}
                </div>
                {hasTasks && (
                    <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        variant === 'danger' && "bg-red-50 text-red-700",
                        variant === 'success' && "bg-emerald-50 text-emerald-700",
                        variant === 'default' && "bg-slate-100 text-slate-700",
                    )}>
                        {tasks.length}
                    </span>
                )}
            </div>

            <div className="flex flex-col gap-2">
                {!hasTasks ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                        <p className="text-sm text-slate-500">{emptyText}</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <DashboardCardItem key={task.id} task={task} />
                    ))
                )}
            </div>
        </div >
    )
}
