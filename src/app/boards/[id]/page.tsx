import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { BoardCanvas } from '@/components/board/board-canvas'
import { ShareDialog } from '@/components/board/share-dialog'
import { createAdminClient } from '@/lib/supabase/admin'

interface PageProps {
    params: Promise<{ id: string }>
}

// Data Models
interface ChecklistItem {
    id: string
    content: string
    is_completed: boolean
    is_mandatory: boolean
}

interface Participant {
    user_id: string
}

interface CardData {
    id: string
    title: string
    description: string | null
    position: number
    due_date: string | null
    checklist_items: ChecklistItem[]
    card_participants: Participant[]
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

    const { data: { user } } = await supabase.auth.getUser()

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
                    is_completed,
                    is_mandatory
                ),
                card_participants (
                    user_id
                )
            )
        `)
        .eq('board_id', id)
        .order('position', { ascending: true })

    // 2.5 Fetch Active Share Token
    const { data: shareData } = await supabase
        .from('board_shares')
        .select('token')
        .eq('board_id', id)
        .eq('is_active', true)
        .single() // Might be null if no share exists

    // 2.6 Fetch Workspace Members (for Assignee/Participant Picker)
    const adminSupabase = createAdminClient()
    const { data: { users: allUsers }, error: usersError } = await adminSupabase.auth.admin.listUsers()

    // Fetch workspace membership
    const { data: memberships } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', boardData.workspace_id)

    const memberIds = new Set(memberships?.map(m => m.user_id))

    // Filter and Map to usable object
    const workspaceMembers = (allUsers || [])
        .filter(u => memberIds.has(u.id))
        .map(u => ({
            id: u.id,
            email: u.email || 'Unbekannt',
        }))

    // 3. Transform & Sort
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
                    <ShareDialog boardId={boardData.id} initialToken={shareData?.token} />
                </div>
            </header>

            {/* Board Canvas */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <BoardCanvas
                    initialColumns={columns}
                    boardId={boardData.id}
                    workspaceMembers={workspaceMembers}
                    currentUserId={user?.id}
                />
            </main>
        </div>
    )
}
