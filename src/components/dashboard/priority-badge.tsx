import { Badge } from "@/components/ui/badge"

interface PriorityBadgeProps {
    priority?: string
}

export function PriorityBadge({ priority = 'normal' }: PriorityBadgeProps) {
    const p = priority.toLowerCase()

    if (p === 'high') {
        return <Badge variant="destructive" className="px-2 py-0 text-[10px] uppercase">Hoch</Badge>
    }
    if (p === 'low') {
        return <Badge variant="secondary" className="px-2 py-0 text-[10px] uppercase bg-slate-100 text-slate-500 hover:bg-slate-200">Niedrig</Badge>
    }

    // Normal or default
    return <Badge variant="outline" className="px-2 py-0 text-[10px] uppercase text-slate-500 border-slate-200">Normal</Badge>
}
