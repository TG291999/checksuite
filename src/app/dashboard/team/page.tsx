import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InviteDialog } from '@/components/settings/invite-dialog'
import { ArrowLeft, Users } from 'lucide-react'

export default async function TeamPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Fetch User Role & Workspace
    const { data: workspaceMember } = await supabase
        .from('workspace_members')
        .select(`
            role,
            workspaces (
                id,
                name
            )
        `)
        .eq('user_id', user.id)
        .single()

    if (!workspaceMember || !workspaceMember.workspaces) {
        redirect('/dashboard') // Should not happen if correctly seeded
    }

    const company = workspaceMember.workspaces as any
    const myRole = workspaceMember.role

    // STRICT: Only Owner/Admin can see this page
    if (myRole !== 'owner' && myRole !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="bg-slate-100 p-4 rounded-full">
                    <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Zugriff verweigert</h2>
                <p className="text-slate-500 max-w-md text-center">
                    Sie benötigen Administrator-Rechte, um das Team zu verwalten.
                </p>
                <Link href="/dashboard">
                    <Button variant="outline">Zurück zum Dashboard</Button>
                </Link>
            </div>
        )
    }

    // 2. Fetch Members (requires Admin client for Emails)
    const adminSupabase = createAdminClient()
    
    // Fetch members from DB
    const { data: members } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', company.id)
        .order('joined_at', { ascending: true })

    // Fetch user details from Auth (Admin)
    const { data: { users } } = await adminSupabase.auth.admin.listUsers()
    
    const userMap = new Map<string, string>()
    if (users) {
        users.forEach((u: any) => userMap.set(u.id, u.email || ''))
    }

    const membersWithEmail = members?.map(m => ({
        ...m,
        email: userMap.get(m.user_id) || 'Unbekannt'
    }))

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Team verwalten</h2>
                    <p className="text-muted-foreground">
                        {company.name} • {members?.length} Mitglieder
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                     <InviteDialog workspaceId={company.id} userRole={myRole} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Mitglieder</CardTitle>
                    <CardDescription>Verwalten Sie Zugriffsrechte und Mitglieder Ihrer Organisation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {membersWithEmail?.map((member) => (
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
                                <div className="flex items-center gap-2">
                                     <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border border-slate-200">
                                        {member.role === 'admin' ? 'Admin' : member.role === 'owner' ? 'Inhaber' : 'Mitglied'}
                                    </Badge>
                                    {/* Future: Actions Dropdown (Change Role, Remove) */}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
