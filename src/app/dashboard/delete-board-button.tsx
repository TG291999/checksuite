'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteBoard } from './actions'

interface DeleteBoardButtonProps {
    boardId: string
    boardName: string
}

export function DeleteBoardButton({ boardId, boardName }: DeleteBoardButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete(e: React.MouseEvent) {
        e.preventDefault() // Prevent navigation to the board
        e.stopPropagation()

        if (!confirm(`Board "${boardName}" wirklich löschen? Alle Spalten und Karten werden ebenfalls gelöscht.`)) {
            return
        }

        setIsDeleting(true)
        try {
            await deleteBoard(boardId)
        } catch (error) {
            console.error('Failed to delete board', error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isDeleting}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
