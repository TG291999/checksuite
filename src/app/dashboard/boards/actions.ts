'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBoards() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get User Org
    const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return []

    const { data: boards, error } = await supabase
        .from('boards')
        .select(`
            id, name, created_at, is_structure_locked,
            origin_template:process_templates(name, icon),
            origin_version:process_template_versions(version_number)
        `)
        .eq('workspace_id', member.workspace_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching boards:', error)
        return []
    }

    return boards
}

export async function createManualBoard(name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()

    if (!member) throw new Error('No org')

    const { data: board, error } = await supabase
        .from('boards')
        .insert({
            workspace_id: member.workspace_id,
            name,
            is_structure_locked: false // Manual boards are unlocked
        })
        .select()
        .single()

    if (error) throw new Error(error.message)

    // Init Standard Columns
    const columns = ['To Do', 'In Bearbeitung', 'Erledigt']
    for (const [i, col] of columns.entries()) {
        await supabase.from('columns').insert({ board_id: board.id, name: col, position: i })
    }

    revalidatePath('/dashboard/boards')
    return board.id
}

export async function deleteBoard(boardId: string) {
    const supabase = await createClient()

    // Check lock? Usually users can delete even locked boards (process instances) if they are done.
    // But maybe restrain it? For now allow delete.

    const { error } = await supabase.from('boards').delete().eq('id', boardId)
    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/boards')
}
