'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

async function logActivity(supabase: any, cardId: string, type: 'move' | 'create' | 'update' | 'checklist', content: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('card_activities').insert({
        card_id: cardId,
        user_id: user.id,
        type,
        content
    })
}

// Helper to get Org ID
async function getOrgId(supabase: any, boardId: string) {
    const { data } = await supabase.from('boards').select('workspace_id').eq('id', boardId).single()
    return data?.workspace_id
}

export async function getActivities(cardId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('card_activities')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false })

    return data || []
}

export async function createCard(boardId: string, columnId: string, title: string) {
    const supabase = await createClient()

    // 1. Get max position in this column
    const { data: maxPosData } = await supabase
        .from('cards')
        .select('position')
        .eq('column_id', columnId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const newPosition = (maxPosData?.position ?? -1) + 1

    // 2. Insert new card
    const { data: card, error } = await supabase
        .from('cards')
        .insert({
            column_id: columnId,
            title: title,
            position: newPosition,
            assigned_to: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

    if (error || !card) {
        console.error('Error creating card:', error)
        throw new Error('Failed to create card')
    }

    await logActivity(supabase, card.id, 'create', `Karte "${title}" erstellt`)

    // 3. Revalidate
    revalidatePath(`/boards/${boardId}`)
}

export async function moveCard(boardId: string, cardId: string, newColumnId: string, newPosition: number) {
    const supabase = await createClient()

    // Fetch old state for context? Optional.

    // 1. Fetch Current Card & Column Info to enforce Compliance
    const { data: card } = await supabase
        .from('cards')
        .select(`
            column_id, 
            checklist_items(id, is_completed, is_mandatory)
        `)
        .eq('id', cardId)
        .single()

    if (card && card.column_id !== newColumnId) {
        // Fetch source column compliance settings
        const { data: sourceCol } = await supabase
            .from('columns')
            .select('requires_task_completion')
            .eq('id', card.column_id)
            .single()

        if (sourceCol?.requires_task_completion) {
            const incompleteItems = card.checklist_items.filter((i: any) => !i.is_completed)
            if (incompleteItems.length > 0) {
                // Determine if user can override
                const { data: { user } } = await supabase.auth.getUser()
                const orgId = await getOrgId(supabase, boardId)

                // Fetch user role
                const { data: member } = await supabase
                    .from('workspace_members')
                    .select('role')
                    .eq('workspace_id', orgId)
                    .eq('user_id', user?.id)
                    .single()

                const canOverride = member?.role === 'owner' || member?.role === 'admin'

                if (!canOverride) {
                    throw new Error("Checkliste unvollständig. Bitte alle Aufgaben erledigen.")
                } else {
                    // Log Override
                    if (orgId) {
                        await logAuditEvent(orgId, 'OVERRIDE_BLOCKER', 'card', cardId, { reason: 'Move with incomplete tasks' })
                    }
                }
            }
        }
    }

    const { error } = await supabase
        .from('cards')
        .update({
            column_id: newColumnId,
            position: newPosition,
        })
        .eq('id', cardId)

    if (error) {
        console.error('Error moving card:', error)
        throw new Error('Failed to move card')
    }

    // AUDIT LOG
    const orgId = await getOrgId(supabase, boardId)
    if (orgId) {
        // We could fetch column names for better metadata
        await logAuditEvent(orgId, 'CARD_MOVE', 'card', cardId, { newColumnId, newPosition })
    }

    revalidatePath(`/boards/${boardId}`)
    revalidatePath(`/boards/${boardId}`)
    revalidatePath(`/boards/${boardId}`)

    await logActivity(supabase, cardId, 'move', `Karte verschoben`)
}

export async function updateCard(boardId: string, cardId: string, updates: { title?: string, description?: string, due_date?: string | null, assigned_to?: string | null }) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', cardId)

    if (error) {
        console.error('Error updating card:', error)
        throw new Error('Failed to update card')
    }

    revalidatePath(`/boards/${boardId}`)
}

export async function addChecklistItem(boardId: string, cardId: string, content: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('checklist_items')
        .insert({
            card_id: cardId,
            content: content,
            is_completed: false,
            is_mandatory: false,
        })

    if (error) {
        console.error('Error adding checklist item:', error)
        throw new Error('Failed to add item')
    }

    await logActivity(supabase, cardId, 'checklist', `Checkliste: "${content}" hinzugefügt`)

    revalidatePath(`/boards/${boardId}`)
}

export async function toggleChecklistItem(boardId: string, itemId: string, isCompleted: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('checklist_items')
        .update({ is_completed: isCompleted })
        .eq('id', itemId)

    if (error) {
        console.error('Error toggling checklist item:', error)
        throw new Error('Failed to toggle item')
    }

    const { data: item } = await supabase
        .from('checklist_items')
        .select('card_id, content')
        .eq('id', itemId)
        .single()

    if (item) {
        await logActivity(supabase, item.card_id, 'checklist', `Checkliste: "${item.content}" ${isCompleted ? 'erledigt' : 'unerledigt'}`)

        // AUDIT LOG
        const orgId = await getOrgId(supabase, boardId)
        if (orgId) {
            await logAuditEvent(
                orgId,
                isCompleted ? 'CHECKLIST_COMPLETE' : 'CHECKLIST_INCOMPLETE',
                'checklist_item',
                itemId,
                { cardId: item.card_id, content: item.content }
            )
        }
    }

    revalidatePath(`/boards/${boardId}`)
}

export async function deleteChecklistItem(boardId: string, itemId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', itemId)

    if (error) {
        console.error('Error deleting checklist item:', error)
        throw new Error('Failed to delete item')
    }

    revalidatePath(`/boards/${boardId}`)
}

export async function updateChecklistItem(boardId: string, itemId: string, content: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('checklist_items')
        .update({ content })
        .eq('id', itemId)

    if (error) {
        console.error('Error updating checklist item:', error)
        throw new Error('Failed to update item')
    }

    revalidatePath(`/boards/${boardId}`)
}

export async function toggleChecklistMandatory(boardId: string, itemId: string, isMandatory: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('checklist_items')
        .update({ is_mandatory: isMandatory })
        .eq('id', itemId)

    if (error) {
        console.error('Error toggling checklist mandatory:', error)
        throw new Error('Failed to toggle mandatory')
    }

    revalidatePath(`/boards/${boardId}`)
}

export async function createColumn(boardId: string, name: string) {
    const supabase = await createClient()

    const { data: maxPosData } = await supabase
        .from('columns')
        .select('position')
        .eq('board_id', boardId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const newPosition = (maxPosData?.position ?? -1) + 1

    const { error } = await supabase
        .from('columns')
        .insert({
            board_id: boardId,
            name: name,
            position: newPosition,
        })

    if (error) {
        console.error('Error creating column:', error)
        throw new Error('Failed to create column')
    }

    revalidatePath(`/boards/${boardId}`)
}

export async function updateColumn(boardId: string, columnId: string, name: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('columns')
        .update({ name })
        .eq('id', columnId)

    if (error) {
        console.error('Error updating column:', error)
        throw new Error('Failed to update column')
    }
    revalidatePath(`/boards/${boardId}`)
}

export async function deleteColumn(boardId: string, columnId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('columns').delete().eq('id', columnId)

    if (error) {
        console.error('Error deleting column:', error)
        throw new Error('Failed to delete column')
    }

    revalidatePath(`/boards/${boardId}`)
    revalidatePath(`/boards/${boardId}`)
}

export async function createShareLink(boardId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: existing } = await supabase
        .from('board_shares')
        .select('token')
        .eq('board_id', boardId)
        .eq('is_active', true)
        .single()

    if (existing) return existing.token

    const token = crypto.randomUUID()
    const { error } = await supabase.from('board_shares').insert({ board_id: boardId, token, is_active: true })

    if (error) {
        console.error('Error creating share link:', error)
        throw new Error('Failed to create share link')
    }

    revalidatePath(`/boards/${boardId}`)
    return token
}

export async function revokeShareLink(boardId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('board_shares').update({ is_active: false }).eq('board_id', boardId)
    if (error) throw new Error('Failed to revoke link')
    revalidatePath(`/boards/${boardId}`)
}

export async function getSharedBoard(token: string) {
    const supabase = createAdminClient()

    const { data: share, error: shareError } = await supabase
        .from('board_shares')
        .select('board_id')
        .eq('token', token)
        .eq('is_active', true)
        .single()

    if (shareError || !share) return null

    const { data: board } = await supabase.from('boards').select('*').eq('id', share.board_id).single()
    if (!board) return null

    const { data: columns } = await supabase
        .from('columns')
        .select(`
            *,
            cards (
                *,
                checklist_items (*)
            )
        `)
        .eq('board_id', board.id)
        .order('position')

    const sortedColumns = columns?.map(col => ({
        ...col,
        cards: col.cards
            .sort((a: any, b: any) => a.position - b.position)
            .map((card: any) => ({
                ...card,
                checklist_items: card.checklist_items.sort((a: any, b: any) =>
                    (a.created_at > b.created_at ? 1 : -1)
                )
            }))
    }))

    return { ...board, columns: sortedColumns }
}

export async function addParticipant(boardId: string, cardId: string, userId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('card_participants').insert({ card_id: cardId, user_id: userId })
    if (error) {
        console.error('Error adding participant:', error)
        throw new Error('Failed to add participant')
    }
    await logActivity(supabase, cardId, 'update', `Teilnehmer hinzugefügt`)
    revalidatePath(`/boards/${boardId}`)
}

export async function removeParticipant(boardId: string, cardId: string, userId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('card_participants').delete().eq('card_id', cardId).eq('user_id', userId)
    if (error) {
        console.error('Error removing participant:', error)
        throw new Error('Failed to remove participant')
    }
    await logActivity(supabase, cardId, 'update', `Teilnehmer entfernt`)
    revalidatePath(`/boards/${boardId}`)
}
