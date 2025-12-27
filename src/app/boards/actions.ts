'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'

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

export async function getActivities(cardId: string) {
    const supabase = await createClient()

    // Fetch activities with user email (mocked join or simpler just fetch and display)
    // For MVP, knowing "someone" did it is okay, but names are better.
    // Supabase auth users table is not publicly readable usually.
    // We can fetch user metadata if needed or just rely on 'user_id' for now.
    // Actually, let's fetch raw and maybe join with profiles if we had them.
    // We don't have a public profiles table yet? 
    // Checking previous steps: AP11 added templates.
    // We'll stick to displaying "User" or just the content for now, or fetch user if possible.
    // Let's just return the activities.
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
    // We can do this by selecting the card with the highest position
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
    // 3. Revalidate
    revalidatePath(`/boards/${boardId}`)

    // 4. Log Activity
    // We need the card ID. insert returns row?
    // Let's update the insert above to select.
    // Wait, the previous code didn't select.
    // I need to change the insert to select single().
}

export async function moveCard(boardId: string, cardId: string, newColumnId: string, newPosition: number) {
    const supabase = await createClient()

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

    // Need cardId to log. Since we only have boardId and itemId, we need to fetch cardId? 
    // Or just log it blindly? The logActivity requires cardId.
    // Let's quickly fetch the card_id from the item.
    const { data: item } = await supabase
        .from('checklist_items')
        .select('card_id, content')
        .eq('id', itemId)
        .single()

    if (item) {
        await logActivity(supabase, item.card_id, 'checklist', `Checkliste: "${item.content}" ${isCompleted ? 'erledigt' : 'unerledigt'}`)
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

    // 1. Get max position
    const { data: maxPosData } = await supabase
        .from('columns')
        .select('position')
        .eq('board_id', boardId)
        .order('position', { ascending: false })
        .limit(1)
        .single()

    const newPosition = (maxPosData?.position ?? -1) + 1

    // 2. Insert
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

export async function createShareLink(boardId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Check if link exists
    const { data: existing } = await supabase
        .from('board_shares')
        .select('token')
        .eq('board_id', boardId)
        .eq('is_active', true)
        .single()

    if (existing) return existing.token

    const token = crypto.randomUUID()

    const { error } = await supabase
        .from('board_shares')
        .insert({
            board_id: boardId,
            token,
            is_active: true
        })

    if (error) {
        console.error('Error creating share link:', error)
        throw new Error('Failed to create share link')
    }

    revalidatePath(`/boards/${boardId}`)
    return token
}

export async function revokeShareLink(boardId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('board_shares')
        .update({ is_active: false })
        .eq('board_id', boardId)

    if (error) throw new Error('Failed to revoke link')

    revalidatePath(`/boards/${boardId}`)
}

export async function getSharedBoard(token: string) {
    const supabase = createAdminClient()

    // 1. Validate token
    const { data: share, error: shareError } = await supabase
        .from('board_shares')
        .select('board_id')
        .eq('token', token)
        .eq('is_active', true)
        .single()

    if (shareError || !share) return null

    // 2. Fetch Board Data (Read-Only)
    const { data: board } = await supabase
        .from('boards')
        .select('*')
        .eq('id', share.board_id)
        .single()

    if (!board) return null

    // 3. Fetch Columns & Cards
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

    // Sort cards and checklist items (Supabase order() on foreign tables is tricky in simple query, do in JS)
    const sortedColumns = columns?.map(col => ({
        ...col,
        cards: col.cards
            .sort((a: any, b: any) => a.position - b.position)
            .map((card: any) => ({
                ...card,
                checklist_items: card.checklist_items.sort((a: any, b: any) =>
                    (a.created_at > b.created_at ? 1 : -1) // Simple sort by creation
                )
            }))
    }))

    return { ...board, columns: sortedColumns }
}

export async function deleteColumn(boardId: string, columnId: string) {
    const supabase = await createClient()

    // Note: This will cascade delete all cards in the column due to DB foreign key constraints
    const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId)

    if (error) {
        console.error('Error deleting column:', error)
        throw new Error('Failed to delete column')
    }

    revalidatePath(`/boards/${boardId}`)
    revalidatePath(`/boards/${boardId}`)
}

export async function addParticipant(boardId: string, cardId: string, userId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('card_participants')
        .insert({ card_id: cardId, user_id: userId })

    if (error) {
        console.error('Error adding participant:', error)
        throw new Error('Failed to add participant')
    }

    await logActivity(supabase, cardId, 'update', `Teilnehmer hinzugefügt`)
    revalidatePath(`/boards/${boardId}`)
}

export async function removeParticipant(boardId: string, cardId: string, userId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('card_participants')
        .delete()
        .eq('card_id', cardId)
        .eq('user_id', userId)

    if (error) {
        console.error('Error removing participant:', error)
        throw new Error('Failed to remove participant')
    }

    await logActivity(supabase, cardId, 'update', `Teilnehmer entfernt`)
    revalidatePath(`/boards/${boardId}`)
}
