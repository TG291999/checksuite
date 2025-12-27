'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function acceptInvite(token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Redirect to login/register with return URL logic?
        // For MVP, just redirect to register saying "Please register/login first"
        // Ideally we pass the token to register so it auto-accepts after signup.
        // Let's implement that flow: /register?invite=token
        redirect(`/register?invite=${token}`)
    }

    // 1. Find Invite
    // We need admin client effectively, or RLS should allow reading invites if token matches?
    // User is auth'd but not in workspace yet.
    // We need a server-side function to check token validity bypass RLS or having RLS that allows public read by token (risky).
    // ALTERNATIVE: Use Admin Client.
    const adminSupabase = await import('@/lib/supabase/admin').then(mod => mod.createAdminClient())

    const { data: invite, error } = await adminSupabase
        .from('workspace_invites')
        .select('*')
        .eq('token', token)
        .single()

    if (error || !invite) {
        return { error: 'Ungültiger oder abgelaufener Link.' }
    }

    // 2. Check Expiry
    if (new Date(invite.expires_at) < new Date()) {
        return { error: 'Einladung ist abgelaufen.' }
    }

    // 3. Add to Workspace
    const { error: memberError } = await adminSupabase
        .from('workspace_members')
        .insert({
            workspace_id: invite.workspace_id,
            user_id: user.id,
            role: invite.role
        })

    if (memberError) {
        // Duplicate key error means already member?
        if (memberError.code === '23505') {
            // Already member, just delete invite and redirect
        } else {
            console.error('Failed to add member', memberError)
            return { error: 'Fehler beim Beitreten.' }
        }
    }

    // 4. Delete Invite
    await adminSupabase
        .from('workspace_invites')
        .delete()
        .eq('id', invite.id)

    revalidatePath('/dashboard')
    redirect('/dashboard')
}
