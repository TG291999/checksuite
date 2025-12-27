'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to generate a random token
function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function createInvite(workspaceId: string, email: string, role: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 1. Validate Email
    if (!email || !email.includes('@')) {
        return { error: 'Ungültige E-Mail-Adresse' }
    }

    // 2. Check Permission (Admin only)
    // We do this check in DB RLS too, but good to have here for UX feedback
    const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return { error: 'Nur Admins können Mitglieder einladen.' }
    }

    // 3. Create Invitation
    const token = generateToken()

    // Check if invite exists? RLS might handle duplicates if email is unique per workspace?
    // Our schema doesn't enforce unique email per workspace in `workspace_invites` but it's good practice.
    // For now, we just insert.

    const { error } = await supabase
        .from('workspace_invites')
        .insert({
            workspace_id: workspaceId,
            email: email.trim().toLowerCase(),
            role: role,
            token: token,
            invited_by: user.id
        })

    if (error) {
        console.error('Failed to create invite', error)
        return { error: 'Fehler beim Erstellen der Einladung.' }
    }

    revalidatePath('/settings')
    return { success: true, token: token }
}

export async function revokeInvite(inviteId: string) {
    const supabase = await createClient()

    // RLS will handle permission checks (only admins can delete)
    const { error } = await supabase
        .from('workspace_invites')
        .delete()
        .eq('id', inviteId)

    if (error) {
        console.error('Failed to revoke invite', error)
        return { error: 'Fehler beim Löschen.' }
    }

    revalidatePath('/settings')
    return { success: true }
}
