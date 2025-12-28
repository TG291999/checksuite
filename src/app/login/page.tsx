import Link from 'next/link'
import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckSuiteLogo } from '@/components/brand/logo'

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams
    const error = searchParams.error

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 gap-6">
            <Link href="/">
                <CheckSuiteLogo height={60} />
            </Link>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Anmelden</CardTitle>
                    <CardDescription>
                        Gib deine E-Mail-Adresse ein, um dich anzumelden.
                    </CardDescription>
                </CardHeader>
                <form action={login}>
                    <CardContent className="grid gap-4">
                        {error && (
                            <div className="rounded bg-destructive/15 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}
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
                        <Button className="w-full">Anmelden</Button>
                        <div className="text-center text-sm">
                            Noch keinen Account?{' '}
                            <Link href="/register" className="underline underline-offset-4">
                                Registrieren
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
