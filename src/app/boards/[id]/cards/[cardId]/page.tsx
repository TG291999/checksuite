import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChecklistManager } from '@/components/board/checklist-manager'
import { Separator } from '@/components/ui/separator'
import { CardDateSelector } from '@/components/board/card-date-selector'
import { EditableTitle } from '@/components/board/editable-title'
import { EditableDescription } from '@/components/board/editable-description'

interface PageProps {
    params: Promise<{ id: string; cardId: string }>
    searchParams?: Promise<any>
}

export default async function CardDetailsPage(props: PageProps) {
    const params = await props.params;
    const { id: boardId, cardId } = params
    const supabase = await createClient()

    // Fetch Card Details
    const { data: card, error } = await supabase
        .from('cards')
        .select(`
            *,
            columns (
                name,
                board_id
            ),
            checklist_items (
                id,
                content,
                is_completed
            )
        `)
        .eq('id', cardId)
        .single()

    if (error || !card) {
        console.error("Card fetch error", error)
        return notFound()
    }

    // Security & Context Check: Ensure card belongs to the current board
    // Note: 'columns' is accessed as a single object due to the foreign key relationship
    if ((card.columns as any)?.board_id !== boardId) {
        return notFound()
    }

    // Sort Checklist Items (DB doesn't guarantee order, though usually insertion order)
    const sortedChecklist = (card.checklist_items || []).sort((a: any, b: any) =>
        (a.created_at || '').localeCompare(b.created_at || '')
    )

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b h-16 flex items-center px-6 sticky top-0 z-10">
                <Link href={`/boards/${boardId}`}>
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
                        <ArrowLeft className="h-4 w-4" />
                        Zurück zum Board
                    </Button>
                </Link>
                <div className="ml-4 h-6 w-px bg-slate-200" />
                <div className="ml-4 flex items-center gap-2 text-sm text-slate-500">
                    <span>{card.columns?.name}</span>
                    <span>/</span>
                    <span className="font-medium text-slate-900 truncate max-w-[200px]">{card.title}</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container max-w-4xl mx-auto py-8 px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border shadow-sm p-6 sm:p-8">
                            <EditableTitle
                                cardId={card.id}
                                boardId={boardId}
                                initialTitle={card.title}
                            />

                            <EditableDescription
                                cardId={card.id}
                                boardId={boardId}
                                initialDescription={card.description}
                            />

                            <Separator className="my-8" />

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    Checkliste
                                </h3>
                                <div className="bg-slate-50 rounded-lg p-1 border">
                                    <ChecklistManager
                                        cardId={card.id}
                                        boardId={boardId}
                                        items={sortedChecklist}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Meta & Actions */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500">
                                    Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Due Date */}
                                <div>
                                    <label className="text-xs font-semibold text-slate-900 mb-2 block">
                                        Fälligkeitsdatum
                                    </label>
                                    <CardDateSelector
                                        boardId={boardId}
                                        cardId={cardId}
                                        initialDate={card.due_date}
                                    />
                                </div>

                                <Separator />

                                {/* Metadata */}
                                <div className="space-y-2 text-sm text-slate-500">
                                    <div className="flex justify-between">
                                        <span>Erstellt am:</span>
                                        <span>{format(new Date(card.created_at), 'dd.MM.yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Spalte:</span>
                                        <Badge variant="outline">{card.columns?.name}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
