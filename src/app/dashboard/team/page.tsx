import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InviteDialog } from '@/components/settings/invite-dialog'
import { ArrowLeft, Users, Shield } from 'lucide-react'
import { RoleManager } from '@/components/team/role-manager'
import { MemberRoleSelect } from '@/components/team/member-role-select'
import { de } from '@/lib/i18n/de'

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
        redirect('/dashboard')
    }

    const company = workspaceMember.workspaces as any
    const myRole = workspaceMember.role

    if (myRole !== 'owner' && myRole !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="bg-slate-100 p-4 rounded-full">
                    <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{de.team.accessDenied}</h2>
                <p className="text-slate-500 max-w-md text-center">
                    {de.team.accessDeniedDesc}
                </p>
                <Link href="/dashboard">
                    <Button variant="outline">{de.common.back}</Button>
                </Link>
            </div>
        )
    }

    // 2. Fetch Members & Roles
    const adminSupabase = createAdminClient()

    const { data: members } = await supabase
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', company.id)
        .order('joined_at', { ascending: true })

    const { data: roles } = await supabase
        .from('organization_roles')
        .select('*')
        .eq('organization_id', company.id)
        .order('name')

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
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{de.team.title}</h2>
                    <p className="text-muted-foreground">
                        {company.name} • {members?.length} Mitglieder
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <InviteDialog workspaceId={company.id} userRole={myRole} />
                </div>
            </div>

            {/* Role Management Section */}
            <Card className="bg-slate-50 border-dashed">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#9146FF]" /> {de.team.roles.title}
                    </CardTitle>
                    <CardDescription>
                        {de.team.subtitle}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RoleManager roles={roles || []} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{de.team.members.title}</CardTitle>
                    <CardDescription>Verwalten Sie Zugriffsrechte und Mitglieder Ihrer Organisation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {membersWithEmail?.map((member) => (
                            <div key={member.user_id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="bg-indigo-100 text-[#9146FF] font-medium">
                                            {member.email?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {member.email}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>Beigetreten am {new Date(member.joined_at).toLocaleDateString('de-DE')}</span>
                                            {member.role === 'owner' && <span className="text-amber-600 font-semibold">• Eigentümer</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Functional Role Selector */}
                                    <MemberRoleSelect
                                        userId={member.user_id}
                                        currentRoleId={member.functional_role_id}
                                        roles={roles || []}
                                    />

                                    {/* Admin Badge */}
                                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-none border border-slate-200">
                                        {member.role === 'admin' ? 'Admin' : member.role === 'owner' ? 'Inhaber' : 'Mitglied'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
