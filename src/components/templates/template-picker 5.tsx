'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBoardFromTemplate } from '@/app/dashboard/actions'
import { FileStack, ArrowRight, Loader2 } from 'lucide-react'

interface Template {
    id: string
    slug: string
    name: string
    description: string | null
    icon: string | null
    category: string | null
}

interface TemplatePickerProps {
    templates: Template[]
}

export function TemplatePicker({ templates }: TemplatePickerProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [boardName, setBoardName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [step, setStep] = useState<'select' | 'name'>('select')

    function handleSelectTemplate(template: Template) {
        setSelectedTemplate(template)
        setBoardName(template.name) // Pre-fill with template name
        setStep('name')
    }

    async function handleCreate() {
        if (!selectedTemplate || !boardName.trim()) return

        setIsCreating(true)
        try {
            const result = await createBoardFromTemplate(selectedTemplate.id, boardName)
            if (result?.boardId) {
                setOpen(false)
                router.push(`/boards/${result.boardId}`)
            } else if (result?.error) {
                console.error('Failed to create board:', result.error)
            }
        } catch (error) {
            console.error('Failed to create board:', error)
        } finally {
            setIsCreating(false)
        }
    }

    function handleBack() {
        setStep('select')
        setSelectedTemplate(null)
    }

    function handleOpenChange(newOpen: boolean) {
        setOpen(newOpen)
        if (!newOpen) {
            // Reset state when closing
            setStep('select')
            setSelectedTemplate(null)
            setBoardName('')
        }
    }

    // Group templates by category
    const templatesByCategory = templates.reduce((acc, template) => {
        const category = template.category || 'Sonstige'
        if (!acc[category]) acc[category] = []
        acc[category].push(template)
        return acc
    }, {} as Record<string, Template[]>)

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileStack className="h-4 w-4" />
                    Aus Template
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                {step === 'select' ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Template auswählen</DialogTitle>
                            <DialogDescription>
                                Starte mit einem vorgefertigten Prozess – inkl. Schritten und Checklisten.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                            {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                                <div key={category} className="mb-6">
                                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
                                    <div className="grid gap-3">
                                        {categoryTemplates.map((template) => (
                                            <Card
                                                key={template.id}
                                                className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all"
                                                onClick={() => handleSelectTemplate(template)}
                                            >
                                                <CardHeader className="p-4 pb-2">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <span className="text-xl">{template.icon || '📋'}</span>
                                                        {template.name}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0">
                                                    <CardDescription className="text-sm">
                                                        {template.description || 'Kein Beschreibung verfügbar'}
                                                    </CardDescription>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {templates.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileStack className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Keine Templates verfügbar.</p>
                                    <p className="text-sm mt-1">Templates müssen in der Datenbank angelegt werden.</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <span className="text-xl">{selectedTemplate?.icon || '📋'}</span>
                                {selectedTemplate?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Gib deinem Board einen Namen. Die Prozess-Schritte werden automatisch angelegt.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="boardName">Board-Name</Label>
                                <Input
                                    id="boardName"
                                    value={boardName}
                                    onChange={(e) => setBoardName(e.target.value)}
                                    placeholder="z.B. Kunde XY Onboarding"
                                    autoFocus
                                />
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button variant="ghost" onClick={handleBack} disabled={isCreating}>
                                    Zurück
                                </Button>
                                <Button onClick={handleCreate} disabled={isCreating || !boardName.trim()} className="gap-2">
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Erstelle...
                                        </>
                                    ) : (
                                        <>
                                            Board erstellen
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
