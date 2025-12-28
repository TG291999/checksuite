'use client'

import { Button } from "@/components/ui/button"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Play } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { startProcessFromTemplate, getWorkspaceMembers } from "@/app/dashboard/library/actions"
import { useRouter } from "next/navigation"

interface StartProcessDialogProps {
    templateId: string
    versionId: string
    versionNumber: number
}

export function StartProcessDialog({ templateId, versionId, versionNumber }: StartProcessDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")
    const [assignee, setAssignee] = useState("")
    const [members, setMembers] = useState<{ userId: string; email: string }[]>([])

    const router = useRouter()

    useEffect(() => {
        if (open && members.length === 0) {
            getWorkspaceMembers().then(setMembers)
        }
    }, [open, members.length])

    async function handleStart() {
        if (!name || !assignee) {
            toast.error("Bitte Namen und Verantwortlichen angeben.")
            return
        }

        try {
            setLoading(true)
            const boardId = await startProcessFromTemplate(templateId, versionId, assignee, name)
            toast.success("Prozess erfolgreich gestartet!")
            setOpen(false)
            router.push(`/boards/${boardId}`)
        } catch (e: any) {
            toast.error("Fehler beim Starten: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[#6D28D9] hover:bg-[#5b21b6]">
                    <Play className="mr-2 h-4 w-4" /> Prozess starten
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Prozess instanziieren</DialogTitle>
                    <DialogDescription>
                        Startet eine neue Instanz basierend auf Template v{versionNumber}.0
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Vorgang
                        </Label>
                        <Input
                            id="name"
                            placeholder="z.B. Onboarding Müller GmbH"
                            className="col-span-3"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="assignee" className="text-right">
                            Verantw.
                        </Label>
                        <div className="col-span-3">
                            <Select value={assignee} onValueChange={setAssignee}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Person wählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(m => (
                                        <SelectItem key={m.userId} value={m.userId}>
                                            {m.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleStart} disabled={loading}>
                        {loading ? 'Startet...' : 'Jetzt starten'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
