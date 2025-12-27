import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSharedBoard } from '@/app/boards/actions'
import { BoardCanvas } from '@/components/board/board-canvas'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

// Reuse types if possible, or redefine locally since they are simple
// For clean architecture, we should export them from a shared location, but standard duplication is fine for MVP speed.

interface PageProps {
    params: Promise<{ token: string }>
}

export default async function SharedBoardPage({ params }: PageProps) {
    const { token } = await params

    // Fetch data using admin client via Server Action
    const boardData = await getSharedBoard(token)

    if (!boardData) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="rounded-full bg-slate-100 p-4">
                    <Check className="h-8 w-8 text-slate-400" />
                </div>
                <h1 className="text-xl font-semibold text-slate-900">Link nicht gültig oder abgelaufen</h1>
                <p className="text-slate-500">Das Board existiert nicht oder wurde deaktiviert.</p>
                <Link href="/">
                    <Button>Zur Startseite</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            {/* Public Header */}
            <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    {/* Logo / Brand */}
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
                            CS
                        </div>
                        <span className="font-semibold text-slate-900">CheckSuite</span>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <h1 className="text-lg font-medium text-slate-600">
                        {boardData.name} <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Read Only</span>
                    </h1>
                </div>
                <div>
                    <Link href="/register">
                        <Button variant="outline" size="sm">Eigene Boards erstellen</Button>
                    </Link>
                </div>
            </header>

            {/* Read-Only Canvas */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <BoardCanvas
                    initialColumns={boardData.columns}
                    boardId={boardData.id}
                    isReadOnly={true}
                />
            </main>
        </div>
    )
}
