'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Validate inputs (basic)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        redirect('/login?error=Missing credentials')
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login Error:', error)
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

import { seedNewUser } from '@/lib/onboarding'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = (formData.get('email') as string)?.trim()
    const password = (formData.get('password') as string)?.trim()

    if (!email || !password) {
        redirect('/register?error=Missing credentials')
    }

    const companyName = (formData.get('companyName') as string)?.trim()
    const inviteToken = (formData.get('inviteToken') as string)?.trim()

    // Basic email format validation (optional, Supabase does it too)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        redirect('/register?error=Invalid email format')
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    console.log('Signup Result:', { user: data.user?.id, session: !!data.session, error })

    if (error) {
        console.error('Signup Error:', error)
        // Pass the actual error message for better debugging
        redirect(`/register?error=${encodeURIComponent(error.message)}`)
    }

    let redirectTo = '/dashboard'

    // If signup was successful and we have a user
    if (data.user) {
        // If coming from an Invite, accept it!
        if (inviteToken) {
            // Re-use logic from acceptInvite but we are in a server action and just signed up
            // We can call a helper function or duplicate logic.
            // Since we established `acceptInvite` in `src/app/invite/actions.ts`, let's import it if possible?
            // `acceptInvite` expects to read cookies for user, which fits.
            // BUT: `acceptInvite` does redirects. We want to control redirect.
            // Better: Duplicating the critical Invite Logic here for safety & transaction-like flow.

            const adminSupabase = await import('@/lib/supabase/admin').then(mod => mod.createAdminClient())

            // 1. Verify Invite
            const { data: invite } = await adminSupabase
                .from('workspace_invites')
                .select('*')
                .eq('token', inviteToken)
                .single()

            if (invite && new Date(invite.expires_at) > new Date()) {
                // 2. Add Member
                await adminSupabase.from('workspace_members').insert({
                    workspace_id: invite.workspace_id,
                    user_id: data.user.id,
                    role: invite.role
                })

                // 3. Cleanup
                await adminSupabase.from('workspace_invites').delete().eq('id', invite.id)

                // No Seeding needed, joining existing company
                // Redirect will be Dashboard
            } else {
                console.warn('Signup with invalid/expired invite token:', inviteToken)
                // Fallback: Seed new user? Or just error?
                // If invite failed, user has account but no workspace.
                // Safest: Seed new workspace so they are not broken.
                await seedNewUser(supabase, data.user.id, companyName)
            }
        } else {
            // Normal Signup -> Seed
            const boardId = await seedNewUser(supabase, data.user.id, companyName)
            if (boardId) {
                redirectTo = `/boards/${boardId}`
            }
        }
    }

    revalidatePath('/', 'layout')
    redirect(redirectTo)
}

export async function logout() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        // Handle error if needed, but usually just redirect
        console.error('Logout error:', error)
    }

    revalidatePath('/', 'layout')
    redirect('/login')
}
