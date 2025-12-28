'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { createOrganizationRole, deleteOrganizationRole } from "@/app/dashboard/team/actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export function RoleManager({ roles }: { roles: any[] }) {
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleCreate() {
        if (!name) return
        setLoading(true)
        try {
            // Random dark-ish color for simplicity
            const colors = ['#e11d48', '#d97706', '#16a34a', '#2563eb', '#7c3aed', '#db2777']
            const color = colors[Math.floor(Math.random() * colors.length)]

            await createOrganizationRole(name, color)
            setName("")
            toast.success("Rolle erstellt")
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Rolle wirklich löschen? Zuweisungen werden entfernt.")) return
        try {
            await deleteOrganizationRole(id)
            toast.success("Gelöscht")
        } catch (e: any) {
            toast.error(e.message)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Neue Rolle (z.B. Buchhaltung)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="max-w-sm"
                />
                <Button onClick={handleCreate} disabled={loading || !name}>Erstellen</Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
                {roles.map(role => (
                    <Badge key={role.id} variant="outline" className="px-3 py-1 gap-2 border-slate-300 bg-white">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: role.color }} />
                        {role.name}
                        <button
                            onClick={() => handleDelete(role.id)}
                            className="ml-1 text-slate-400 hover:text-red-500"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                {roles.length === 0 && <span className="text-sm text-slate-400 italic">Keine Rollen definiert.</span>}
            </div>
        </div>
    )
}
