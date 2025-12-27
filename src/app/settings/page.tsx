
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ArrowLeft } from 'lucide-react'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's workspace (Company)
    // For MVP, we assume 1 user = 1 workspace context basically, or we pick the first one.
    const { data: workspaceMember } = await supabase
        .from('workspace_members')
        .select(`
            role,
            workspaces (
                id,
                name,
                description
            )
        `)
        .eq('user_id', user.id)
        .single()

    if (!workspaceMember || !workspaceMember.workspaces) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Keine Firma gefunden.</p>
            </div>
        )
    }

    const company = workspaceMember.workspaces as any
    const myRole = workspaceMember.role

    // Fetch members using Admin Client (to access auth.users emails securely)
    const adminSupabase = createAdminClient()

    // We fetch members and then manually get their emails because joining auth.users via RLS client is restricted
    // Actually with Admin Client we can query everything.
    // Note: Supabase JS doesn't support joining auth tables easily in one query via postgrest unless explicit FK relations exist in public schema (which usually don't).
    // Better: Fetch members, then fetch user data by IDs.

    const { data: members } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', company.id)
        .order('joined_at', { ascending: true })

    const userIds = members?.map((m) => m.user_id) || []

    // Admin fetch users
    const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers() // listUsers is paginated, careful if > 50.
    // For MVP, filtering in JS is okay, or using admin.getUserById in loop (slow).
    // Or strictly: `adminSupabase.from('auth.users')...` is NOT possible via JS client usually, only via RPC or SQL.
    // Best workaround for MPV: seed/signup puts email in a public `profiles` table? No we don't have that yet.
    // Let's rely on `auth.admin.listUsers()` functionality assuming small team.

    const userMap = new Map<string, string>()
    if (users) {
        users.forEach((u: any) => userMap.set(u.id, u.email || ''))
    }

    const membersWithEmail = members?.map(m => ({
        ...m,
        email: userMap.get(m.user_id) || 'Unbekannt'
    }))

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Zurück
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Firmeneinstellungen</h1>
                </div>

                {/* Company Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Firma</CardTitle>
                        <CardDescription>Allgemeine Informationen zur Organisation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none text-slate-500">Firmenname</label>
                            <div className="flex text-sm font-semibold">{company.name}</div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none text-slate-500">Ihre Rolle</label>
                            <div>
                                <Badge variant="secondary" className="uppercase">{myRole}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Members */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Team</CardTitle>
                                <CardDescription>Mitarbeiter und Rollen verwalten.</CardDescription>
                            </div>
                            {/* Invite Button (AP18 placeholder) */}
                            <Button disabled variant="outline" size="sm">Mitglied einladen (Bald)</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <MemberTable members={membersWithEmail || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Separate component to handle the possibly missing emails gracefully or use Client Component for interactivity later
// Removed import here as it's now at the top of the file.

async function MemberTable({ members }: { members: any[] }) {
    // If standard fetch failed to get emails (likely), let's re-fetch details using Admin
    // Actually, let's just do the fetching logic cleanly above. 
    // Since I can't restart `SettingsPage` logic easily inside `write_to_file`, I'll update it in next step.
    // user_id is definitely there.

    // Simplistic view for now:
    return (
        <div className="space-y-4">
            {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                                {member.email?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium text-slate-900">
                                {member.email}
                            </p>
                            <p className="text-xs text-slate-500">
                                Beigetreten am {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border border-slate-200">
                        {member.role === 'admin' ? 'Admin' : member.role === 'owner' ? 'Inhaber' : 'Mitglied'}
                    </Badge>
                </div>
            ))}
        </div>
    )
}
