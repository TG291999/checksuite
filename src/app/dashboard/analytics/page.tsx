import { getAnalyticsData } from './actions'
import { KPICards } from '@/components/analytics/kpi-cards'
import { WorkloadChart } from '@/components/analytics/workload-chart'
import { BottleneckChart } from '@/components/analytics/bottleneck-chart'
import { OverdueList } from '@/components/analytics/overdue-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AnalyticsPage() {
    const data = await getAnalyticsData()

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 min-h-screen bg-slate-50">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h2>
                    <p className="text-muted-foreground">
                        Übersicht über die Performance und Auslastung des Teams.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard">
                        <Button variant="outline">Zurück zum Dashboard</Button>
                    </Link>
                </div>
            </div>

            <KPICards
                total={data.totalCards}
                overdue={data.overdueCards}
                activeUsers={data.cardsPerUser.length}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                <div className="col-span-1 lg:col-span-4">
                    <WorkloadChart data={data.cardsPerUser} />
                </div>
                <div className="col-span-1 lg:col-span-3">
                    <BottleneckChart data={data.cardsPerColumn} />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <OverdueList items={data.overdueList} />
                {/* Future: Recent Activity or Team Mood? */}
            </div>
        </div>
    )
}
