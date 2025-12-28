import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { createAdminClient } from '@/lib/supabase/admin'
import { CheckSuiteLogo } from '@/components/brand/logo'

export default async function RegisterPage(props: { searchParams: Promise<{ error?: string; invite?: string }> }) {
    const searchParams = await props.searchParams
    const error = searchParams.error
    const inviteToken = searchParams.invite

    let inviteContext = null
    if (inviteToken) {
        const supabase = createAdminClient()
        // Join with workspaces to get name
        const { data: invite } = await supabase
            .from('workspace_invites')
            .select('workspace_id, workspaces(name)')
            .eq('token', inviteToken)
            .single()

        if (invite) {
            inviteContext = {
                token: inviteToken,
                companyName: (invite.workspaces as any)?.name || 'Unbekannte Firma'
            }
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 gap-6">
            <Link href="/">
                <CheckSuiteLogo height={60} />
            </Link>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Registrieren</CardTitle>
                    <CardDescription>
                        {inviteContext ? (
                            <span>Du wurdest eingeladen, <strong>{inviteContext.companyName}</strong> beizutreten.</span>
                        ) : (
                            'Erstelle einen neuen Account, um mit CheckSuite zu starten.'
                        )}
                    </CardDescription>
                </CardHeader>
                <form action={signup}>
                    <CardContent className="grid gap-4">
                        {error && (
                            <div className="rounded bg-destructive/15 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {inviteContext && (
                            <input type="hidden" name="inviteToken" value={inviteContext.token} />
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="companyName">Firma / Organisation</Label>
                            <Input
                                id="companyName"
                                name="companyName"
                                placeholder="Meine Firma GmbH"
                                required
                                defaultValue={inviteContext?.companyName || ''}
                                readOnly={!!inviteContext}
                                className={inviteContext ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}
                            />
                            {!inviteContext && (
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Neue Organisation erstellen. Wenn Sie bereits eingeladen wurden, nutzen Sie den Link in der E-Mail.
                                </p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">E-Mail</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Passwort</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button className="w-full">
                            {inviteContext ? 'Beitreten & Account erstellen' : 'Account erstellen'}
                        </Button>
                        <div className="text-center text-sm">
                            Bereits einen Account?{' '}
                            <Link href="/login" className="underline underline-offset-4">
                                Anmelden
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
