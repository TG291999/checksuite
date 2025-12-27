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
import { createShareLink, revokeShareLink } from '@/app/boards/actions'
import { Check, Copy, Globe, Loader2, Lock } from 'lucide-react'

interface ShareDialogProps {
    boardId: string
    initialToken?: string | null
}

export function ShareDialog({ boardId, initialToken }: ShareDialogProps) {
    const [token, setToken] = useState<string | null>(initialToken || null)
    const [isLoading, setIsLoading] = useState(false)
    const [hasCopied, setHasCopied] = useState(false)

    const shareUrl = token ? `${window.location.origin}/share/${token}` : ''

    async function handleShare() {
        setIsLoading(true)
        try {
            const newToken = await createShareLink(boardId)
            setToken(newToken)
        } catch (error) {
            console.error('Failed to create share link', error)
            alert('Fehler beim Erstellen des Links')
        } finally {
            setIsLoading(false)
        }
    }

    async function handleRevoke() {
        if (!confirm('Wirklich den öffentlichen Zugriff deaktivieren? Der aktuelle Link wird ungültig.')) return

        setIsLoading(true)
        try {
            await revokeShareLink(boardId)
            setToken(null)
        } catch (error) {
            console.error('Failed to revoke share link', error)
            alert('Fehler beim Deaktivieren')
        } finally {
            setIsLoading(false)
        }
    }

    function copyToClipboard() {
        navigator.clipboard.writeText(shareUrl)
        setHasCopied(true)
        setTimeout(() => setHasCopied(false), 2000)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Teilen
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Externer Zugriff</DialogTitle>
                    <DialogDescription>
                        Erstelle einen öffentlichen Link, um dieses Board im Nur-Lese-Modus zu teilen.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {!token ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div className="rounded-full bg-slate-100 p-3">
                                <Lock className="h-6 w-6 text-slate-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-medium">Board ist privat</h4>
                                <p className="text-sm text-slate-500">Nur Workspace-Mitglieder haben Zugriff.</p>
                            </div>
                            <Button onClick={handleShare} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                                Öffentlichen Link erstellen
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                    {hasCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                                Jeder mit diesem Link kann das Board sehen.
                            </p>
                            <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={isLoading} className="w-full">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Zugriff deaktivieren'}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
