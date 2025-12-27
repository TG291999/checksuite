import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateBoardDialog } from './create-board-dialog'
import { DeleteBoardButton } from './delete-board-button'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ArrowRight, Layout } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return redirect('/login')
    }

    // 1. Fetch Workspaces the user is a member of
    const { data: memberWorkspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)

    const workspaceIds = memberWorkspaces?.map(mw => mw.workspace_id) || []

    // 2. Fetch Boards in those workspaces
    // We also fetch workspace name to display correctly
    const { data: boards } = await supabase
        .from('boards')
        .select(`
            id,
            name,
            created_at,
            workspaces (
                name
            )
        `)
        .in('workspace_id', workspaceIds)
        .order('created_at', { ascending: false })

    const hasBoards = boards && boards.length > 0

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
                    <Layout className="h-6 w-6" />
                    <span className="tracking-tight">CheckSuite</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 hidden sm:inline-block">{user.email}</span>
                    <form action={async () => {
                        'use server'
                        const supabase = await createClient()
                        await supabase.auth.signOut()
                        redirect('/login')
                    }}>
                        <button className="text-sm text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
                            Abmelden
                        </button>
                    </form>
                </div>
            </header>

            <main className="container max-w-6xl mx-auto py-12 px-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Deine Boards</h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Verwalte deine Projekte und Aufgaben an einem Ort.
                        </p>
                    </div>

                    {hasBoards && (
                        <CreateBoardDialog />
                    )}
                </div>

                {hasBoards ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.map((board) => (
                            <Link key={board.id} href={`/boards/${board.id}`} className="group block h-full">
                                <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer bg-white border-slate-200 group-hover:border-indigo-200">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                        <div className="space-y-1.5">
                                            <CardTitle className="group-hover:text-indigo-600 transition-colors text-xl">
                                                {board.name}
                                            </CardTitle>
                                            <CardDescription className="text-sm font-medium text-slate-400">
                                                {(board.workspaces as any)?.name || 'Mein Workspace'}
                                            </CardDescription>
                                        </div>
                                        <DeleteBoardButton boardId={board.id} boardName={board.name} />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                            Board öffnen <ArrowRight className="ml-1 h-4 w-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm max-w-2xl mx-auto">
                        <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Layout className="h-8 w-8 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            Noch keine Boards
                        </h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">
                            Dein Workspace ist besenrein, aber leer. <br />
                            Erstelle dein erstes Projekt, um loszulegen.
                        </p>
                        <CreateBoardDialog />
                    </div>
                )}
            </main>
        </div>
    )
}
