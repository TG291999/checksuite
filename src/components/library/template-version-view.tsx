'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare, ListOrdered, Lock, Play, Share, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"
import { getVersionDetails, createNewDraft, publishTemplateVersion } from "@/app/dashboard/library/actions"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StartProcessDialog } from "./start-process-dialog"

interface TemplateVersionViewProps {
    templateId: string
    initialVersion: any
    hasDraft: boolean
}

export default function TemplateVersionView({ templateId, initialVersion, hasDraft }: TemplateVersionViewProps) {
    const [version, setVersion] = useState<any>(initialVersion)
    const [loading, setLoading] = useState(false)
    const [publishDialogOpen, setPublishDialogOpen] = useState(false)
    const [publishNote, setPublishNote] = useState("")

    // In a real app, clicking sidebar would update this via URL or state lift.
    // For simplicity, we stick to initialVersion or let parent handle routing.
    // Assuming this component mounts with the "best" version to show.

    if (!version) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Sparkles className="h-12 w-12 mb-4 text-slate-300" />
                <p>Noch keine Versionen vorhanden.</p>
                <Button className="mt-4" onClick={handleCreateDraft}>Ersten Draft erstellen</Button>
            </div>
        )
    }

    async function handleCreateDraft() {
        try {
            setLoading(true)
            const newId = await createNewDraft(templateId)
            toast.success("Neuer Draft erstellt")
            window.location.reload() // Brute force refresh to pick up new draft
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    async function handlePublish() {
        try {
            setLoading(true)
            await publishTemplateVersion(version.id, publishNote)
            toast.success("Version veröffentlicht!")
            setPublishDialogOpen(false)
            window.location.reload()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    const isDraft = version.status === 'draft'

    return (
        <div className="max-w-4xl mx-auto pb-12">

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="text-slate-400 font-medium">v{version.version_number}.0</span>
                        {isDraft ? 'Entwurf' : 'Veröffentlicht'}
                    </h2>
                    <p className="text-slate-500 mt-1">
                        {isDraft ? 'Bearbeitungsmodus — Änderungen werden nicht live übernommen.' : 'Diese Version ist aktiv und kann gestartet werden.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!isDraft && (
                        <Button onClick={handleCreateDraft} disabled={loading || hasDraft} variant="outline">
                            {hasDraft ? 'Draft existiert bereits' : 'Neue Version erstellen'}
                        </Button>
                    )}
                    {isDraft && (
                        <div className="flex gap-2">
                            <Button variant="outline" disabled>Editor öffnen</Button> {/* Placeholder for future Editor */}

                            <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                                        Veröffentlichen
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Version veröffentlichen?</DialogTitle>
                                        <DialogDescription>
                                            Diese Version wird für alle Mitarbeiter verfügbar. Aktive Prozesse bleiben unberührt.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label>Änderungsnotiz (Optional)</Label>
                                            <Input
                                                placeholder="Was ist neu in dieser Version?"
                                                value={publishNote}
                                                onChange={e => setPublishNote(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Abbrechen</Button>
                                        <Button onClick={handlePublish} disabled={loading}>Jetzt veröffentlichen</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                    {!isDraft && (
                        <StartProcessDialog
                            templateId={templateId}
                            versionId={version.id}
                            versionNumber={version.version_number}
                        />
                    )}
                </div>
            </div>

            {/* Steps Visualization */}
            <div className="space-y-6">
                {/* Note: In a real implementation we would fetch steps here if not passed. 
                    Assuming initialVersion has steps? Unlikely based on `getTemplates` query. 
                    We should fetch them via effect if missing. */}
                <StepsLoader versionId={version.id} initialData={version.steps} />
            </div>

        </div>
    )
}

function StepsLoader({ versionId, initialData }: { versionId: string, initialData?: any[] }) {
    const [steps, setSteps] = useState<any[]>(initialData || [])
    const [loading, setLoading] = useState(!initialData)

    useEffect(() => {
        if (initialData) return

        async function load() {
            setLoading(true)
            // We need a fetch action that returns populated steps
            const fullVersion = await getVersionDetails(versionId)
            if (fullVersion?.steps) setSteps(fullVersion.steps)
            setLoading(false)
        }
        load()
    }, [versionId, initialData])

    if (loading) return <div className="p-8 text-center text-slate-400">Lade Schritte...</div>

    if (steps.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
                <p className="text-slate-500 font-medium">Diese Version hat noch keine Schritte definiert.</p>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-200" />

            <div className="space-y-8">
                {steps.map((step, index) => (
                    <div key={step.id} className="relative flex gap-6">
                        <div className="z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-slate-50 bg-white shadow-sm text-xl font-bold text-slate-700">
                            {index + 1}
                        </div>
                        <Card className="flex-1 border-slate-200 shadow-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex justify-between text-base">
                                    <span>{step.name}</span>
                                    {step.require_checklist_complete && (
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            <Lock className="mr-1 h-3 w-3" /> Pflicht-Check
                                        </Badge>
                                    )}
                                </CardTitle>
                                {step.description && <p className="text-sm text-slate-500">{step.description}</p>}
                            </CardHeader>
                            {step.items && step.items.length > 0 && (
                                <CardContent className="pb-4 pt-0">
                                    <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                                        {step.items.map((item: any) => (
                                            <div key={item.id} className="flex items-start gap-3 text-sm text-slate-700">
                                                <CheckSquare className="h-4 w-4 mt-0.5 text-slate-400" />
                                                <span>{item.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    )
}
