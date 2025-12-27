'use server'

import { createClient } from '@/lib/supabase/server'
import { seedNewUser } from '@/lib/onboarding'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createDemoBoard() {
    console.log('--- createDemoBoard Triggered ---')
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.error('createDemoBoard: No user found', userError)
        return
    }

    console.log('createDemoBoard: User found, attempting to seed', user.id)
    const boardId = await seedNewUser(supabase, user.id)
    console.log('createDemoBoard: Seed result (boardId)', boardId)

    if (boardId) {
        revalidatePath('/dashboard')
        redirect(`/boards/${boardId}`)
    } else {
        console.error('createDemoBoard: Failed to create board (returned null)')
    }
}

export async function createBoard(formData: FormData) {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.error('createBoard: No user found', userError)
        return
    }

    const boardName = formData.get('boardName') as string
    if (!boardName || !boardName.trim()) {
        console.error('createBoard: No board name provided')
        return
    }

    // 1. Get or create user's workspace
    let { data: workspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(id, name)')
        .eq('user_id', user.id)
        .limit(1)

    let workspaceId: string

    if (!workspaces || workspaces.length === 0) {
        // Create workspace if none exists
        const { data: newWorkspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({ name: 'Mein Workspace' })
            .select()
            .single()

        if (wsError || !newWorkspace) {
            console.error('createBoard: Failed to create workspace', wsError)
            return
        }

        // Add user as member
        await supabase
            .from('workspace_members')
            .insert({ workspace_id: newWorkspace.id, user_id: user.id, role: 'owner' })

        workspaceId = newWorkspace.id
    } else {
        workspaceId = workspaces[0].workspace_id
    }

    // 2. Create Board
    const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
            workspace_id: workspaceId,
            name: boardName.trim(),
        })
        .select()
        .single()

    if (boardError || !board) {
        console.error('createBoard: Failed to create board', boardError)
        return
    }

    // 3. Create default columns
    const defaultColumns = [
        { name: 'To Do', position: 0 },
        { name: 'In Progress', position: 1 },
        { name: 'Done', position: 2 },
    ]

    const { error: colError } = await supabase
        .from('columns')
        .insert(
            defaultColumns.map((col) => ({
                board_id: board.id,
                name: col.name,
                position: col.position,
            }))
        )

    if (colError) {
        console.error('createBoard: Failed to create columns', colError)
        // Board exists, but columns failed - still redirect
    }

    revalidatePath('/dashboard')
    redirect(`/boards/${board.id}`)
}

export async function deleteBoard(boardId: string) {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.error('deleteBoard: No user found', userError)
        return { error: 'Unauthorized' }
    }

    // Delete will cascade to columns, cards, and checklist items due to DB constraints
    const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId)

    if (error) {
        console.error('deleteBoard: Failed to delete board', error)
        return { error: 'Failed to delete board' }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function createBoardFromTemplate(templateId: string, boardName: string) {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
        console.error('createBoardFromTemplate: No user found', userError)
        return { error: 'Unauthorized' }
    }

    if (!boardName || !boardName.trim()) {
        return { error: 'Board name is required' }
    }

    // 1. Fetch template with steps and checklist items
    const { data: template, error: templateError } = await supabase
        .from('process_templates')
        .select(`
            id,
            name,
            template_steps (
                id,
                name,
                description,
                position,
                require_checklist_complete,
                template_checklist_items (
                    id,
                    content,
                    position
                )
            )
        `)
        .eq('id', templateId)
        .eq('is_active', true)
        .single()

    if (templateError || !template) {
        console.error('createBoardFromTemplate: Template not found', templateError)
        return { error: 'Template not found' }
    }

    // 2. Get or create user's workspace
    let { data: workspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)

    let workspaceId: string

    if (!workspaces || workspaces.length === 0) {
        const { data: newWorkspace, error: wsError } = await supabase
            .from('workspaces')
            .insert({ name: 'Mein Workspace', owner_id: user.id })
            .select()
            .single()

        if (wsError || !newWorkspace) {
            console.error('createBoardFromTemplate: Failed to create workspace', wsError)
            return { error: 'Failed to create workspace' }
        }

        workspaceId = newWorkspace.id
    } else {
        workspaceId = workspaces[0].workspace_id
    }

    // 3. Create Board
    const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
            workspace_id: workspaceId,
            name: boardName.trim(),
        })
        .select()
        .single()

    if (boardError || !board) {
        console.error('createBoardFromTemplate: Failed to create board', boardError)
        return { error: 'Failed to create board' }
    }

    // 4. Create Columns from Template Steps
    const steps = (template.template_steps || []).sort((a: any, b: any) => a.position - b.position)

    for (const step of steps) {
        const { data: column, error: colError } = await supabase
            .from('columns')
            .insert({
                board_id: board.id,
                name: step.name,
                position: step.position,
            })
            .select()
            .single()

        if (colError || !column) {
            console.error('createBoardFromTemplate: Failed to create column', colError)
            continue
        }

        // 5. Create a welcome card in the first column with template checklist
        if (step.position === 0) {
            const { data: card, error: cardError } = await supabase
                .from('cards')
                .insert({
                    column_id: column.id,
                    title: `Neuer ${template.name}`,
                    description: `Erstellt aus Template: ${template.name}`,
                    position: 0,
                    assigned_to: user.id,
                })
                .select()
                .single()

            if (!cardError && card) {
                // Add checklist items from template
                const checklistItems = (step.template_checklist_items || [])
                    .sort((a: any, b: any) => a.position - b.position)

                if (checklistItems.length > 0) {
                    await supabase
                        .from('checklist_items')
                        .insert(
                            checklistItems.map((item: any, idx: number) => ({
                                card_id: card.id,
                                content: item.content,
                                position: idx,
                                is_completed: false,
                                is_mandatory: item.is_mandatory || false,
                            }))
                        )
                }
            }
        }
    }

    revalidatePath('/dashboard')
    return { success: true, boardId: board.id }
}
