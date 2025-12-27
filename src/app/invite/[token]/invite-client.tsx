'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { acceptInvite } from '@/app/invite/actions'
import { Loader2, UserPlus, AlertCircle } from 'lucide-react'

// Note: In Next.js client component cannot be async page unless it's server component.
// We make this a client component for interaction, wrapping it in page.
export default function InvitePageContent({ token }: { token: string }) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleAccept() {
        setIsLoading(true)
        setError(null)
        try {
            const result = await acceptInvite(token)
            // If redirect happens in server action, this might not execute if success
            if (result && result.error) {
                setError(result.error)
            }
        } catch (err) {
            console.error(err)
            setError('Ein unerwarteter Fehler ist aufgetreten.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                        <UserPlus className="h-6 w-6 text-indigo-600" />
                    </div>
                    <CardTitle>Team-Einladung</CardTitle>
                    <CardDescription>
                        Du wurdest eingeladen, einem Team auf CheckSuite beizutreten.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {error && (
                        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <Button onClick={handleAccept} disabled={isLoading} size="lg" className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Einladung annehmen'}
                    </Button>

                    <p className="text-center text-xs text-slate-500">
                        Du musst eingeloggt sein, um beizutreten.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
