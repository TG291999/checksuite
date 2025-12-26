'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    const { error } = await supabase
        .from('cards')
        .insert({
            column_id: columnId,
            title: title,
            position: newPosition,
        })

    if (error) {
        console.error('Error creating card:', error)
        throw new Error('Failed to create card')
    }

    // 3. Revalidate
    revalidatePath(`/boards/${boardId}`)
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
        })

    if (error) {
        console.error('Error adding checklist item:', error)
        throw new Error('Failed to add item')
    }

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
}
