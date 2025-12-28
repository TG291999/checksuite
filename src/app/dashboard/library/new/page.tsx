'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createProcessTemplate } from '@/app/dashboard/library/actions'
import { de } from '@/lib/i18n/de'
import { Loader2 } from 'lucide-react'

const CATEGORIES = [
    { value: 'HR', label: 'HR & Personal' },
    { value: 'Finance', label: 'Finanzen & Buchhaltung' },
    { value: 'IT', label: 'IT & Support' },
    { value: 'Operations', label: 'Operations & Logistik' },
    { value: 'Sales', label: 'Vertrieb & Marketing' },
    { value: 'Other', label: 'Sonstiges' }
]

export default function CreateTemplatePage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('Other')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) {
            toast.error('Bitte einen Namen eingeben')
            return
        }

        setIsLoading(true)
        try {
            const templateId = await createProcessTemplate(name, description, category)
            toast.success('Vorlage erfolgreich erstellt')
            router.push(`/dashboard/library/${templateId}`)
        } catch (error) {
            console.error(error)
            toast.error('Fehler beim Erstellen der Vorlage. Prüfen Sie Ihre Berechtigungen.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">{de.library.newTemplate}</CardTitle>
                    <CardDescription>
                        Erstellen Sie eine neue Prozessvorlage. Sie beginnen mit einem leeren Entwurf.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="z.B. Mitarbeiter Onboarding"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Kategorie</Label>
                            <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Kategorie wählen" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="desc">Beschreibung</Label>
                            <Textarea
                                id="desc"
                                placeholder="Wofür wird dieser Prozess genutzt?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isLoading}
                                rows={4}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Link href="/dashboard/library">
                            <Button variant="ghost" type="button" disabled={isLoading}>
                                {de.common.cancel}
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isLoading} className="bg-[#9146FF] hover:bg-[#7e22ce]">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {de.common.loading}
                                </>
                            ) : (
                                de.common.create
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
