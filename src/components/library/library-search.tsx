'use client'

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function LibrarySearch() {
    const searchParams = useSearchParams()
    const { replace } = useRouter()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        replace(`/dashboard/library?${params.toString()}`)
    }, 300)

    const handleCategory = (category: string) => {
        const params = new URLSearchParams(searchParams)
        if (category && category !== 'all') {
            params.set('category', category)
        } else {
            params.delete('category')
        }
        replace(`/dashboard/library?${params.toString()}`)
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Suchen..."
                    className="pl-9"
                    defaultValue={searchParams.get('q')?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
            <Select
                defaultValue={searchParams.get('category')?.toString() || 'all'}
                onValueChange={handleCategory}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
