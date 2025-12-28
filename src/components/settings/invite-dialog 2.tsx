'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createInvite } from '@/app/settings/actions'
import { Loader2, Mail, Link as LinkIcon, Check, Copy } from 'lucide-react'

interface InviteDialogProps {
    workspaceId: string
    userRole: string
}

export function InviteDialog({ workspaceId, userRole }: InviteDialogProps) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('member')
    const [isLoading, setIsLoading] = useState(false)
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [hasCopied, setHasCopied] = useState(false)

    // Only admins/owners see this
    if (!['owner', 'admin'].includes(userRole)) {
        return null
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)
        setInviteLink(null)

        try {
            const result = await createInvite(workspaceId, email, role)
            if (result.error) {
                alert(result.error)
            } else if (result.token) {
                // Determine base URL
                const baseUrl = window.location.origin
                setInviteLink(`${baseUrl}/invite/${result.token}`)
            }
        } catch (error) {
            console.error(error)
            alert('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    function copyLink() {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink)
            setHasCopied(true)
            setTimeout(() => setHasCopied(false), 2000)
        }
    }

    function handleClose() {
        setOpen(false)
        // Reset state after transition
        setTimeout(() => {
            setEmail('')
            setInviteLink(null)
            setRole('member')
        }, 300)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Mitglied einladen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Team einladen</DialogTitle>
                    <DialogDescription>
                        Füge neue Mitglieder per E-Mail hinzu. Sie erhalten Zugriff auf alle Boards der Firma.
                    </DialogDescription>
                </DialogHeader>

                {!inviteLink ? (
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">E-Mail-Adresse</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@firma.de"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rolle</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Mitglied (Standard)</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="viewer">Beobachter (Read Only)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Einladung erstellen
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="rounded-md bg-green-50 p-4 border border-green-200">
                            <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-600" />
                                <p className="text-sm font-medium text-green-800">Einladung erstellt!</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Einladungs-Link</Label>
                            <div className="flex items-center gap-2">
                                <Input value={inviteLink} readOnly className="font-mono text-xs" />
                                <Button size="icon" variant="outline" onClick={copyLink}>
                                    {hasCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                                Sende diesen Link an <strong>{email}</strong>. Er ist 7 Tage gültig.
                            </p>
                        </div>
                        <Button variant="outline" className="w-full" onClick={handleClose}>
                            Fertig
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
