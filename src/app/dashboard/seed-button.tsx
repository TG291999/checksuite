'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export function SeedButton() {
    const { pending } = useFormStatus()

    return (
        <Button disabled={pending}>
            {pending ? 'Erstelle...' : 'Demo-Board erstellen'}
        </Button>
    )
}
