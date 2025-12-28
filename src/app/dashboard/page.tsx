import { Suspense } from 'react'
import { getDashboardData } from './actions'
import { MyDaySection } from '@/components/dashboard/my-day-section'
import { AlertCircle, Calendar, CheckCircle2, ChevronRight, LayoutDashboard, MoreHorizontal, Users } from 'lucide-react'
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

    const { myOverdue, myDue, myNext, isAdmin, adminStats } = data

    // Calculate Workload for "My Workload" card
    const totalOpen = myOverdue.length + myDue.length + myNext.length

    const rangeDescriptions = {
        today: "Alles, was heute erledigt werden sollte.",
        week: "Alles, was diese Woche fällig ist.",
        month: "Alles, was diesen Monat fällig ist."
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-slate-50/50">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Mein Tag</h1>
                    <p className="text-sm text-slate-500">
                        Willkommen zurück! Hier ist dein Überblick.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Add global actions here later if needed */}
                </div>
            </div>

            <div className="container mx-auto grid grid-cols-1 gap-6 p-6 lg:grid-cols-4">

                {/* LEFT COLUMN: Main Tasks (3/4 width on large screens) */}
                <div className="flex flex-col gap-8 lg:col-span-3">

                    {/* Overdue Section */}
                    {myOverdue.length > 0 && (
                        <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
                            <MyDaySection
                                title="Überfällig"
                                icon={AlertCircle}
                                tasks={myOverdue}
                                variant="danger"
                                emptyText="Alles im grünen Bereich."
                            />
                        </div>
                    )}

                    {/* Due (Today/Week/Month) Section */}
                    <div className='animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100'>
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex flex-col">
                                <h3 className="font-semibold text-slate-800">Fällig</h3>
                                <p className="text-xs text-slate-500">{rangeDescriptions[dueRange]}</p>
                            </div>
                            <TimeRangeTabs currentRange={dueRange} />
                        </div>

                        <MyDaySection
                            title="" // Hidden title since we have custom header above
                            icon={CheckCircle2}
                            tasks={myDue}
                            variant="success"
                            emptyText={`Nichts fällig für ${dueRange === 'today' ? 'heute' : dueRange === 'week' ? 'diese Woche' : 'diesen Monat'}.`}
                        />
                    </div>

                    {/* Next Section */}
                    <div className='animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200'>
                        <MyDaySection
                            title="Als Nächstes (Außerhalb Zeitraum / Ohne Datum)"
                            icon={Calendar}
                            tasks={myNext}
                            variant="default"
                            emptyText="Keine weiteren Aufgaben geplant."
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: Sidebar (1/4 width) */}
                <div className="flex flex-col gap-6 lg:col-span-1">

                    {/* Admin Overview (Conditional) */}
                    {isAdmin && adminStats && (
                        <Card className="border-indigo-100 bg-indigo-50/50 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4 text-indigo-600" />
                                    <CardTitle className="text-sm font-semibold text-indigo-900">Firmenüberblick</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                <div className="flex items-center justify-between rounded-md bg-white p-2 px-3 shadow-sm">
                                    <span className="text-xs font-medium text-slate-600">Überfällige Tasks</span>
                                    <span className="text-xs font-bold text-red-600">{adminStats.overdueCount}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-md bg-white p-2 px-3 shadow-sm">
                                    <span className="text-xs font-medium text-slate-600">Ohne Zuweisung</span>
                                    <span className="text-xs font-bold text-orange-600">{adminStats.unassignedCount}</span>
                                </div>
                                <div className="mt-2 text-center">
                                    <Link href="/dashboard/management" className="text-xs font-medium text-indigo-600 hover:underline">
                                        Zum Management Dashboard →
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Personal Workload */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-800">Meine Arbeitslast</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-bold text-slate-900">{totalOpen}</span>
                                    <span className="text-xs text-slate-500">Offene Aufgaben</span>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                    <Users className="h-5 w-5 text-slate-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Links */}
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Schnellzugriff</h3>
                        <div className="flex flex-col gap-2">
                            <Link href="/boards" className="flex items-center justify-between text-sm text-slate-700 hover:text-indigo-600">
                                <span>Alle Boards</span>
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                            <Link href="/dashboard/team" className="flex items-center justify-between text-sm text-slate-700 hover:text-indigo-600">
                                <span>Team verwalten</span>
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
