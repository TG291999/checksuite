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

    // If signup was successful and we have a user, seed data
    if (data.user) {
        // Warning: If email confirmation is ON, data.session might be null,
        // and RLS might fail if it relies on auth.uid().
        if (!data.session) {
            console.warn('User created but NO SESSION. Email confirmation might be required.')
            // We cannot seed if we are not logged in (unless we bypass RLS, which we shouldn't dynamically)
            // But we can try relying on the fact that we have the user ID. 
            // However, strictly RLS policies check auth.uid().
        }

        const boardId = await seedNewUser(supabase, data.user.id, companyName)
        if (boardId) {
            redirectTo = `/boards/${boardId}`
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
