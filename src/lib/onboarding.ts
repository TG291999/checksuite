import { SupabaseClient } from '@supabase/supabase-js'

export async function seedNewUser(supabase: SupabaseClient, userId: string) {
    let workspaceId: string | null = null

    // 1. Check if workspace already exists AND user is a member
    const { data: existingWorkspaces } = await supabase
        .from('workspaces')
        .select(`
            id,
            workspace_members!inner(user_id)
        `)
        .eq('owner_id', userId)
        .eq('workspace_members.user_id', userId)
        .limit(1)

    if (existingWorkspaces && existingWorkspaces.length > 0) {
        workspaceId = existingWorkspaces[0].id
        console.log('Seeding: Reusing existing verified workspace', workspaceId)
    } else {
        // Create New Workspace (even if one exists but is broken/inaccessible)
        console.log('Seeding: Creating new workspace for', userId)
        const { data: workspace, error: workspaceError } = await supabase
            .from('workspaces')
            .insert({
                name: 'Mein Workspace',
                owner_id: userId,
            })
            .select()
            .single()

        if (workspaceError || !workspace) {
            console.error('Error creating workspace:', workspaceError)
            return null
        }
        workspaceId = workspace.id
    }

    // 2. Create Demo Board
    const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
            workspace_id: workspaceId,
            name: 'Demo Board',
        })
        .select()
        .single()

    if (boardError || !board) {
        console.error('Error creating board:', boardError)
        return null
    }

    // 3. Create Columns
    const { data: columns, error: columnsError } = await supabase
        .from('columns')
        .insert([
            { board_id: board.id, name: 'Offen', position: 0 },
            { board_id: board.id, name: 'In Arbeit', position: 1 },
            { board_id: board.id, name: 'Erledigt', position: 2 },
        ])
        .select()

    if (columnsError || !columns) {
        console.error('Error creating columns:', columnsError)
        return board.id
    }

    // 4. Create Demo Cards in the first column
    const todoColumn = columns.find((c) => c.name === 'Offen')
    if (todoColumn) {
        await supabase.from('cards').insert([
            {
                column_id: todoColumn.id,
                title: 'Willkommen bei Flowboard! 👋',
                description: 'Das ist eine Demo-Karte.',
                position: 0,
                assigned_to: userId,
            },
            {
                column_id: todoColumn.id,
                title: 'Bewege mich',
                description: 'Drag & Drop kommt bald.',
                position: 1,
            },
        ])
    }

    return board.id
}
