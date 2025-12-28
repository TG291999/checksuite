import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, List } from 'lucide-react'
import { getProcessTemplates, TemplateFilter } from './actions'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LibrarySearch } from '@/components/library/library-search'
import { TemplateCard } from '@/components/library/template-card'

export default async function LibraryPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { filter = 'all', q, category } = await searchParams

    // Validate filter
    const currentFilter = (['all', 'organization', 'system', 'favorites'].includes(filter as string)
        ? filter
        : 'all') as TemplateFilter

    const templates = await getProcessTemplates(
        currentFilter,
        q as string,
        category as string
    )

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Prozess-Bibliothek</h2>
                    <p className="text-muted-foreground">
                        Verwalten und starten Sie standardisierte Prozesse.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/library/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Neue Vorlage
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="space-y-6">
                {/* Search & Filter */}
                <LibrarySearch />

                {/* Filter Tabs */}
                <div className="flex items-center justify-between">
                    <Tabs defaultValue={currentFilter} className="w-[400px]">
                        <TabsList>
                            <Link href="/dashboard/library?filter=all"><TabsTrigger value="all">Alle</TabsTrigger></Link>
                            <Link href="/dashboard/library?filter=organization"><TabsTrigger value="organization">Meine Org</TabsTrigger></Link>
                            <Link href="/dashboard/library?filter=system"><TabsTrigger value="system">System</TabsTrigger></Link>
                            <Link href="/dashboard/library?filter=favorites"><TabsTrigger value="favorites">Favoriten</TabsTrigger></Link>
                        </TabsList>
                    </Tabs>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        {templates.length} Vorlagen gefunden
                    </div>
                </div>

                {/* Grid */}
                {templates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {templates.map((template) => (
                            <TemplateCard key={template.id} template={template} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-lg border border-dashed">
                        <p className="text-slate-500">Keine Vorlagen gefunden.</p>
                        {currentFilter === 'favorites' && (
                            <p className="text-sm text-slate-400 mt-2">Markieren Sie Vorlagen mit dem Stern-Symbol, um sie hier zu sehen.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
