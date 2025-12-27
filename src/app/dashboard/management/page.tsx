import AnalyticsPage from '../analytics/page'

// Reuse Analytics Page logic but serve at /dashboard/management to verify requirement
// We could wrap it to enforce Owner/Admin checks strictly here too if Analytics didn't.
// However, Analytics is often open to all members, whereas "Management" implies control.
// The user prompt said "Management-Seite (Owner/Admin): Überfällige...".
// My Analytics page currently doesn't check role.
// I should wrap it with a permission check.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, BarChart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function ManagementPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Role Check
    const { data: workspaceMember } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('user_id', user.id)
        .single()
    
    const role = workspaceMember?.role

    if (role !== 'owner' && role !== 'admin') {
         return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="bg-slate-100 p-4 rounded-full">
                    <BarChart className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Zugriff verweigert</h2>
                <p className="text-slate-500 max-w-md text-center">
                    Dieser Bereich ist der Geschäftsführung vorbehalten.
                </p>
                 <Link href="/dashboard">
                    <Button variant="outline">Zurück zum Dashboard</Button>
                </Link>
            </div>
        )
    }

    // Render Analytics content + Maybe extra management actions later
    // For now, we reuse the Analytics layout but wrapped in this check
    return <AnalyticsPage />
}
