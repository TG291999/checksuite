import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateBoardDialog } from './create-board-dialog'
import { DeleteBoardButton } from './delete-board-button'
import { TemplatePicker } from '@/components/templates/template-picker'
import { TaskList } from '@/components/dashboard/task-list'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ArrowRight, Layout, Clock, FileText, BarChart, Users } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return redirect('/login')
    }

    // 1. Fetch Workspaces the user is a member of
    const { data: memberWorkspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)

    const workspaceIds = memberWorkspaces?.map(mw => mw.workspace_id) || []
    const isAdminOrOwner = memberWorkspaces?.some(mw => mw.role === 'owner' || mw.role === 'admin')

    // 2. Fetch Boards in those workspaces
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

    // 3. Fetch available templates
    const { data: templates } = await supabase
        .from('process_templates')
        .select('id, slug, name, description, icon, category')
        .eq('is_active', true)
        .order('name')

    const hasBoards = boards && boards.length > 0

    // 4. Fetch Open Tasks (assigned to user, not in 'Done' column)
    const { data: rawTasks } = await supabase
        .from('cards')
        .select(`
            id,
            title,
            due_date,
            columns (
                name,
                boards (
                    id,
                    name
                )
            )
        `)
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true })

    // Transform and filter tasks
    const allTasks = (rawTasks || []).map((card: any) => ({
        id: card.id,
        title: card.title,
        board_id: card.columns?.boards?.id,
        board_name: card.columns?.boards?.name || 'Unbekanntes Board',
        column_name: card.columns?.name,
        due_date: card.due_date
    })).filter(task => task.column_name !== 'Done' && task.column_name !== 'Erledigt')

    const openTasks = allTasks.slice(0, 5) // Show top 5

    // 5. Filter Overdue Tasks
    const now = new Date()
    const overdueTasks = allTasks.filter(task =>
        task.due_date && new Date(task.due_date) < now
    )

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b px-6 h-16 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
                    <Layout className="h-6 w-6" />
                    <span className="tracking-tight">CheckSuite</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/analytics" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <BarChart className="h-4 w-4" />
                        <span className="hidden sm:inline">Analytics</span>
                    </Link>
                    {isAdminOrOwner && (
                        <Link href="/dashboard/team" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Team</span>
                        </Link>
                    )}
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
                        <div className="flex gap-2">
                            <TemplatePicker templates={templates || []} />
                            <CreateBoardDialog />
                        </div>
                    )}
                </div>

                {hasBoards ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        {/* Task Lists Column (2/3 width on large screens) */}
                        <div className="lg:col-span-2 space-y-6">
                            {(openTasks.length > 0 || overdueTasks.length > 0) ? (
                                <>
                                    {overdueTasks.length > 0 && (
                                        <TaskList
                                            title="Überfällige Vorgänge"
                                            description="Diese Aufgaben erfordern deine Aufmerksamkeit."
                                            tasks={overdueTasks}
                                            variant="warning"
                                            icon={<Clock className="h-5 w-5 text-red-600" />}
                                        />
                                    )}

                                    <TaskList
                                        title="Meine offenen Vorgänge"
                                        description="Deine nächsten Aufgaben nach Fälligkeit."
                                        tasks={openTasks}
                                        icon={<FileText className="h-5 w-5 text-primary" />}
                                    />
                                </>
                            ) : (
                                <div className="bg-white rounded-xl p-8 border border-slate-100 text-center shadow-sm">
                                    <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <div className="text-2xl">🎉</div>
                                    </div>
                                    <h3 className="font-medium text-slate-900">Alles erledigt!</h3>
                                    <p className="text-sm text-slate-500 mt-1">Du hast aktuell keine offenen Aufgaben.</p>
                                </div>
                            )}
                        </div>


                        {/* Recent Boards Column (1/3 width) */}
                        <div className="space-y-6">


                            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Layout className="h-4 w-4" />
                                Aktuelle Boards
                            </h2>
                            <div className="space-y-4">
                                {boards.slice(0, 3).map((board) => (
                                    <Link key={board.id} href={`/boards/${board.id}`} className="block group">
                                        <Card className="hover:shadow-md transition-all duration-200 cursor-pointer bg-white border-slate-200 group-hover:border-primary/50">
                                            <CardHeader className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="group-hover:text-primary transition-colors text-base">
                                                        {board.name}
                                                    </CardTitle>
                                                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                                </div>
                                                <CardDescription className="text-xs mt-1">
                                                    {(board.workspaces as any)?.name || 'Meine Firma'}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                ))}
                                {boards.length > 3 && (
                                    <div className="text-center pt-2">
                                        <span className="text-xs text-muted-foreground">
                                            + {boards.length - 3} weitere Boards
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
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
                            Deine Firma ist eingerichtet, aber noch leer. <br />
                            Starte mit einem Template oder erstelle ein leeres Board.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <TemplatePicker templates={templates || []} />
                            <CreateBoardDialog />
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
