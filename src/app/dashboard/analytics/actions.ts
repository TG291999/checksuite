'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface AnalyticsData {
    totalCards: number
    overdueCards: number
    cardsPerUser: { email: string; count: number }[]
    cardsPerColumn: { name: string; count: number }[]
    overdueList: {
        id: string
        title: string
        due_date: string
        assigned_to_email: string | null
        board_name: string
    }[]
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 1. Fetch all cards with columns and board info (to check ownership/permissions effectively? 
    // Actually, RLS filters cards by workspace mostly. We need to ensure we fetch all cards relevant to the user's workspace.
    // If the user is an admin/owner, they see everything. If member, they see everything in workspace usually.
    // Let's assume the user wants analytics for the CURRENT workspace context.
    // Since we don't have a strict "Current Workspace" global state in this simple app (it's often derived from board),
    // we might need to fetch all boards the user has access to, then all cards in those boards.
    // OR, if the user is in multiple workspaces, this might aggregate across them?
    // For AP16, we renamed Workspace to Company. A user usually belongs to 1 company in this MVP context or we show all.
    // Let's fetch all cards the user can see via RLS.

    const { data: cards, error } = await supabase
        .from('cards')
        .select(`
            id,
            title,
            due_date,
            assigned_to,
            column_id,
            columns (
                name,
                board_id,
                boards (
                    name
                )
            )
        `)

    if (error || !cards) {
        console.error('Error fetching analytics:', error)
        return {
            totalCards: 0,
            overdueCards: 0,
            cardsPerUser: [],
            cardsPerColumn: [],
            overdueList: []
        }
    }

    // 2. Fetch Users (for mapping IDs to Emails)
    // We need admin client to list users to get emails for IDs
    const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers()
    const userMap = new Map<string, string>()
    if (users) {
        users.forEach(u => userMap.set(u.id, u.email || 'Unbekannt'))
    }

    // 3. Process Data
    const now = new Date()
    let total = 0
    let overdue = 0
    const userCounts = new Map<string, number>()
    const columnCounts = new Map<string, number>()
    const overdueItems: AnalyticsData['overdueList'] = []

    cards.forEach((card: any) => {
        total++

        // Overdue check
        if (card.due_date && new Date(card.due_date) < now) {
            // Exclude 'Done' columns? Usually yes.
            // Simple heuristic: if column name contains 'fertig' or 'done' (case insensitive)
            const colName = card.columns?.name?.toLowerCase() || ''
            if (!colName.includes('fertig') && !colName.includes('done')) {
                overdue++
                overdueItems.push({
                    id: card.id,
                    title: card.title,
                    due_date: card.due_date,
                    assigned_to_email: card.assigned_to ? userMap.get(card.assigned_to) || 'Unbekannt' : null,
                    board_name: card.columns?.boards?.name || 'Unbekannt'
                })
            }
        }

        // User Counts
        const assignee = card.assigned_to ? (userMap.get(card.assigned_to) || 'Unbekannt') : 'Nicht zugewiesen'
        userCounts.set(assignee, (userCounts.get(assignee) || 0) + 1)

        // Column Counts (Bottlenecks)
        // We might want to aggregate by column NAME across boards (e.g. all "In Progress")
        // or just show raw distribution. Let's aggregate by normalized name.
        const colName = card.columns?.name || 'Unbekannt'
        columnCounts.set(colName, (columnCounts.get(colName) || 0) + 1)
    })

    // 4. Format for Charts
    const cardsPerUser = Array.from(userCounts.entries())
        .map(([email, count]) => ({ email, count }))
        .sort((a, b) => b.count - a.count) // Top workload first

    const cardsPerColumn = Array.from(columnCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

    // Sort overdue by date asc (most overdue first? or soonest?)
    // Usually "most overdue" (oldest date) is top priority or "soonest" depending on view.
    // Let's sort by date ascending (oldest first).
    overdueItems.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())

    return {
        totalCards: total,
        overdueCards: overdue,
        cardsPerUser,
        cardsPerColumn,
        overdueList: overdueItems
    }
}
