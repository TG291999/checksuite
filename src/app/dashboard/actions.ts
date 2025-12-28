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
            .insert({ name: 'Meine Firma' })
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
            .insert({ name: 'Meine Firma', owner_id: user.id })
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

// AP21-AP25: My Day Dashboard Actions

export async function getDashboardData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Helper to get start/end of today in UTC (since DB handles timestamps)
    // We assume the user is in Europe/Berlin for MVP as requested, or just use current server time
    // For simplicity and to avoid timezone hell without a library:
    // We will do a rough comparison using ISO strings and Postgres functions if possible.
    // Better: let Postgres handle "today".
    // AND assigned_to = user.id AND status != 'Done' (we need to filter done columns)
    // Problem: 'Done' status is defined by column name, not a flag on card.
    // We need to join columns and filter by name != 'Done'.

    // Parallel fetch
    const pOverdue = supabase
        .from('cards')
        .select('*, columns!inner(board_id, name), boards!inner(workspace_id, name)')
        .eq('assigned_to', user.id)
        .lt('due_date', new Date().toISOString())
        .neq('columns.name', 'Done') // Assumption: Done column is named 'Done'
        .order('priority', { ascending: false }) // High > Normal > Low (if enum ordered, else text)
    // Note: 'high' < 'low' alphabetically. We might need custom sort in JS if enum isn't ordered "correctly" logic-wise.
    // If enum: high, normal, low. 
    // We will sort in JS to be safe.

    // Today: due_date >= today_start AND due_date <= today_end
    // We can use postgres date_trunc('day', due_date) = current_date? 
    // Let's use JS dates for range to be safe with timezone "Europe/Berlin"
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' })
    const parts = formatter.formatToParts(now)
    const day = parts.find(p => p.type === 'day')?.value
    const month = parts.find(p => p.type === 'month')?.value
    const year = parts.find(p => p.type === 'year')?.value
    const todayString = `${year}-${month}-${day}` // YYYY-MM-DD in Berlin

    // Postgres: due_date::date = todayString
    // But due_date is timestamptz.
    // Simplest: Fetch all assigned active tasks and filter in JS? 
    // Might be heavy if many tasks.
    // Let's try range query.
    // Start of today Berlin: 00:00:00 -> UTC
    // End of today Berlin: 23:59:59 -> UTC
    // Use simple ISO string match for "Today" match is tricky with timezone.
    // Let's rely on PostgREST filter `gte` and `lt`.

    // For MVP "Heute" in generic UTC is often acceptable, but requirement said "Europe/Berlin".
    // Let's fetch "all active assigned to me" and sort/bucket in JS. 
    // This reduces DB queries to 1-2 and allows perfect JS timezone logic.

    const { data: allMyTasks, error: taskError } = await supabase
        .from('cards')
        .select(`
            id, title, due_date, priority, position,
            columns!inner (id, name, board_id), 
            boards!inner (id, name, workspace_id)
        `)
        .eq('assigned_to', user.id)
        .neq('columns.name', 'Done') // Filter out Done
        .order('due_date', { ascending: true, nullsFirst: false })

    if (taskError) {
        console.error('getDashboardData error:', taskError)
        return null
    }

    // Role check for Admin View
    let isAdmin = false
    const { data: member } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (member && (member.role === 'owner' || member.role === 'admin')) {
        isAdmin = true
    }

    // Process Tasks
    const overdue: any[] = []
    const today: any[] = []
    const next: any[] = []

    const berlinNow = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' }) // YYYY-MM-DD

    allMyTasks?.forEach(task => {
        if (!task.due_date) {
            next.push(task)
            return
        }

        const dueDateStart = new Date(task.due_date).toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })

        if (dueDateStart < berlinNow) {
            overdue.push(task)
        } else if (dueDateStart === berlinNow) {
            today.push(task)
        } else {
            next.push(task)
        }
    })

    // Custom Sort (Priority: high > normal > low, then Due Date)
    const priorityWeight = { high: 3, normal: 2, low: 1, null: 0 } as any
    const sorter = (a: any, b: any) => {
        const pA = priorityWeight[a.priority || 'normal']
        const pB = priorityWeight[b.priority || 'normal']
        if (pA !== pB) return pB - pA
        // then specific logic per list (e.g. overdue: oldest first)
        return new Date(a.due_date || '9999').getTime() - new Date(b.due_date || '9999').getTime()
    }

    overdue.sort(sorter)
    today.sort(sorter)
    next.sort(sorter)

    // Limit Next
    const limitedNext = next.slice(0, 20)

    // Admin Stats
    let adminStats = null
    if (isAdmin) {
        // Fetch company wide stats
        // 1. Overdue total (exclude done)
        const { count: overdueCount } = await supabase
            .from('cards')
            .select('id', { count: 'exact', head: true })
            .lt('due_date', new Date().toISOString())
            .neq('columns.name', 'Done') // This fails? inner join needed on columns?
        // Actually, we can't filter by joined column name easily in count header query without deeper setup.
        // Let's do a simple query.
        // Workaround: We assume columns named 'Done' are status done.
        // Better: use the 'cards' table view if we had one.
        // Let's ignore the 'Done' filter for the COUNT aggregate for speed or do a join.
        // supabase-js supports filtering on foreign tables.
        // .select('*, columns!inner(*)') .neq('columns.name', 'Done')

        const { data: overdueData } = await supabase
            .from('cards')
            .select('columns!inner(name)')
            .lt('due_date', new Date().toISOString())
            .neq('columns.name', 'Done')

        // 2. Unassigned
        const { data: unassignedData } = await supabase
            .from('cards')
            .select('columns!inner(name)')
            .is('assigned_to', null)
            .neq('columns.name', 'Done')

        adminStats = {
            overdueCount: overdueData?.length || 0,
            unassignedCount: unassignedData?.length || 0
        }
    }

    return {
        myOverdue: overdue,
        myToday: today,
        myNext: limitedNext,
        adminStats,
        isAdmin
    }
}

export async function updateTaskPriority(cardId: string, priority: string) {
    const supabase = await createClient()

    // Validate
    if (!['high', 'normal', 'low'].includes(priority)) {
        return { error: 'Invalid priority' }
    }

    const { error } = await supabase
        .from('cards')
        .update({ priority })
        .eq('id', cardId)

    if (error) {
        console.error('updatePriority failed', error)
        return { error: 'Failed' }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateTaskDueDate(cardId: string, date: string | null) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('cards')
        .update({ due_date: date })
        .eq('id', cardId)

    if (error) {
        console.error('updateDueDate failed', error)
        return { error: 'Failed' }
    }

    revalidatePath('/dashboard')
    return { success: true }
}
