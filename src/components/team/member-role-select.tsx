'use client'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { assignRoleToMember } from "@/app/dashboard/team/actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface MemberRoleSelectProps {
    userId: string
    currentRoleId: string | null
    roles: any[]
    disabled?: boolean
}

export function MemberRoleSelect({ userId, currentRoleId, roles, disabled }: MemberRoleSelectProps) {

    async function handleValueChange(val: string) {
        try {
            const roleId = val === 'none' ? null : val
            await assignRoleToMember(userId, roleId)
            toast.success("Rolle aktualisiert")
        } catch (e: any) {
            toast.error("Fehler: " + e.message)
        }
    }

    const currentRole = roles.find(r => r.id === currentRoleId)

    return (
        <Select value={currentRoleId || 'none'} onValueChange={handleValueChange} disabled={disabled}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Keine Funktion" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none" className="text-slate-500 italic">
                    Keine Funktion
                </SelectItem>
                {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: role.color }} />
                            {role.name}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
