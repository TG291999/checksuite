'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import { Activity, CheckSquare, Move, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getActivities } from '@/app/boards/actions'

interface ActivityItem {
    id: string
    type: 'move' | 'create' | 'update' | 'checklist'
    content: string
    created_at: string
    user_id: string
}

export function ActivityFeed({ cardId }: { cardId: string }) {
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        getActivities(cardId).then((data) => {
            if (isMounted) {
                setActivities(data as ActivityItem[])
                setLoading(false)
            }
        })
        return () => { isMounted = false }
    }, [cardId])

    function getIcon(type: string) {
        switch (type) {
            case 'move': return <Move className="h-4 w-4 text-blue-500" />
            case 'create': return <Plus className="h-4 w-4 text-green-500" />
            case 'checklist': return <CheckSquare className="h-4 w-4 text-orange-500" />
            default: return <Activity className="h-4 w-4 text-slate-500" />
        }
    }

    if (loading) {
        return <div className="text-xs text-slate-400 py-4 text-center">Lade Aktivitäten...</div>
    }

    if (activities.length === 0) {
        return <div className="text-xs text-slate-400 py-4 text-center">Keine Aktivitäten vorhanden.</div>
    }

    return (
        <div className="space-y-4">
            <h3 className="font-medium text-slate-900 flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Aktivitäten
            </h3>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-slate-50">
                <div className="space-y-4">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 text-sm">
                            <div className="mt-0.5 bg-white p-1 rounded-full border shadow-sm h-min">
                                {getIcon(activity.type)}
                            </div>
                            <div className="grid gap-1">
                                <p className="text-slate-700 leading-snug">
                                    {activity.content}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: de })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
