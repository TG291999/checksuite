import { Suspense } from 'react'
import { getDashboardData } from './actions'
import { MyDaySection } from '@/components/dashboard/my-day-section'
import { AlertCircle, Calendar, CheckCircle2, ChevronRight, LayoutDashboard, MoreHorizontal, Users, Plus, Layers, Kanban } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
    title: 'Mein Tag | CheckSuite',
    description: 'Dein persönlicher Aufgaben-Überblick',
}

// Helper Component for Range Tabs
function TimeRangeTabs({ currentRange }: { currentRange: string }) {
    const ranges = [
        { key: 'today', label: 'Heute' },
        { key: 'week', label: 'Woche' },
        { key: 'month', label: 'Monat' },
    ]

    return (
        <div className="flex bg-slate-100 p-1 rounded-md">
            {ranges.map(r => (
                <Link
                    key={r.key}
                    href={`/dashboard?dueRange=${r.key}`}
                    scroll={false}
                    className={`
                        px-3 py-1 text-xs font-medium rounded-sm transition-all
                        ${currentRange === r.key
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                    `}
                >
                    {r.label}
                </Link>
            ))}
        </div>
    )
}

export default async function DashboardPage(props: { searchParams: Promise<{ dueRange?: string }> }) {
    const searchParams = await props.searchParams
    const dueRange = (searchParams.dueRange as 'today' | 'week' | 'month') || 'today'
    const data = await getDashboardData(dueRange)

    if (!data) {
        return <div className="p-8">Ladefehler. Bitte neu laden.</div>
    }

    const { myOverdue, myDue, myNext, adminStats, isAdmin } = data

    const totalTasks = myOverdue.length + myDue.length + myNext.length

    if (totalTasks === 0 && !isAdmin) {
        // Empty State for Regular Users
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
                <div className="bg-indigo-50 p-6 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-[#6D28D9]" />
                </div>
                <div className="max-w-md">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Alles erledigt!</h2>
                    <p className="text-slate-500 mb-8">
                        Sie haben keine offenen Aufgaben. Starten Sie einen neuen Prozess oder erstellen Sie ein Board.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/dashboard/library">
                            <Button className="bg-[#6D28D9] hover:bg-[#5b21b6]">
                                <Layers className="mr-2 h-4 w-4" /> Prozess starten
                            </Button>
                        </Link>
                        <Link href="/dashboard/boards">
                            <Button variant="outline">
                                <Kanban className="mr-2 h-4 w-4" /> Board erstellen
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Mein Tag</h2>
                    <p className="text-muted-foreground">
                        Hier ist Ihr Überblick für heute.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/library">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Neuer Prozess
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Offene Aufgaben</CardTitle>
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTasks}</div>
                    </CardContent>
                </Card>

                {isAdmin && adminStats && (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-red-600">Überfällig (Alle)</CardTitle>
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{adminStats.overdueCount}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Nicht zugewiesen</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{adminStats.unassignedCount}</div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Main Content: Tasks */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Meine Aufgaben</h3>
                    <TimeRangeTabs currentRange={dueRange} />
                </div>

                {totalTasks === 0 ? (
                    <div className="rounded-md border border-dashed p-8 text-center">
                        <p className="text-slate-500">Keine Aufgaben für diesen Zeitraum.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {myOverdue.length > 0 && (
                            <MyDaySection title="Überfällig" tasks={myOverdue} variant="danger" icon={AlertCircle} />
                        )}
                        {myDue.length > 0 && (
                            <MyDaySection title="Fällig" tasks={myDue} variant="default" icon={Calendar} />
                        )}
                        {myNext.length > 0 && (
                            <MyDaySection title="Demnächst" tasks={myNext} variant="default" icon={Calendar} />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
