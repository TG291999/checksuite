import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { BoardCanvas } from '@/components/board/board-canvas'

interface PageProps {
    params: Promise<{ id: string }>
}

// Data Models (could be moved to types/index.ts later)
interface CardData {
    id: string
    title: string
    description: string | null
    position: number
    due_date: string | null
}

interface ColumnData {
    id: string
    name: string
    position: number
    cards: CardData[]
}

interface BoardData {
    id: string
    name: string
    workspace_id: string
}

export default async function BoardPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch Board
    const { data: board } = await supabase
        .from('boards')
        .select('*')
        .eq('id', id)
        .single()

    if (!board) {
        return notFound()
    }

    const boardData = board as BoardData

    // 2. Fetch Columns with Cards
    const { data: columnsRaw } = await supabase
        .from('columns')
        .select(`
            id,
            name,
            position,
            cards (
                id,
                title,
                description,
                position,
                due_date,
                checklist_items (
                    id,
                    content,
                    is_completed
                )
            )
        `)
        .eq('board_id', id)
        .order('position', { ascending: true })

    // 3. Transform & Sort
    // We explicitly sort cards here because nested Supabase ordering can sometimes be tricky without specific foreign key configs
    const columns: ColumnData[] = (columnsRaw || []).map((col: any) => ({
        id: col.id,
        name: col.name,
        position: col.position,
        cards: (col.cards || []).sort((a: CardData, b: CardData) => a.position - b.position),
    }))

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                            ← Zurück
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-slate-200" />
                    <h1 className="text-lg font-bold text-slate-800">{boardData.name}</h1>
                </div>
                <div>
                    {/* Actions */}
                </div>
            </header>

            {/* Board Canvas */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <BoardCanvas
                    initialColumns={columns}
                    boardId={boardData.id}
                />
            </main>
        </div>
    )
}
