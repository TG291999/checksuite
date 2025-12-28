'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ChevronRight, FileText, Calendar } from "lucide-react"
import Link from "next/link"
import { toggleTemplateFavorite } from "@/app/dashboard/library/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface TemplateCardProps {
    template: any
}

export function TemplateCard({ template }: TemplateCardProps) {
    const router = useRouter()

    async function handleFavorite(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        try {
            await toggleTemplateFavorite(template.id, !template.isFavorite)
            router.refresh()
            toast.success(template.isFavorite ? "Aus Favoriten entfernt" : "Zu Favoriten hinzugefügt")
        } catch (e) {
            toast.error("Fehler beim Aktualisieren")
        }
    }

    const latestVersion = template.latestPublishedVersion || template.latestDraftVersion

    return (
        <Link href={`/dashboard/library/${template.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group relative">
                <button
                    onClick={handleFavorite}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-amber-400 transition-colors z-10"
                >
                    <Star className={`h-5 w-5 ${template.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                        <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl">
                            {template.icon || '📄'}
                        </div>
                        {template.organization_id ? (
                            <Badge variant="outline" className="text-indigo-600 bg-indigo-50 border-indigo-200">
                                Organization
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                System
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="line-clamp-1 group-hover:text-indigo-600 transition-colors">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2 h-10">
                        {template.description || "Keine Beschreibung"}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="text-xs text-slate-500 border-t pt-4 flex flex-col gap-2 items-start">
                    <div className="flex items-center gap-2 w-full">
                        <Calendar className="h-3 w-3" />
                        <span>Updated: {new Date(latestVersion?.created_at || template.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 w-full">
                        <FileText className="h-3 w-3" />
                        <span>{template.versionCount} Versionen</span>
                        {latestVersion?.status === 'draft' && <Badge variant="outline" className="ml-auto text-[10px] h-5">Draft</Badge>}
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )
}
