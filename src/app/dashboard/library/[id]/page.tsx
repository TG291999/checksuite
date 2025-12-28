import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, ChevronRight, FileText, History, Layout, Plus } from "lucide-react"
import Link from "next/link"
import { getTemplateDetails } from "../actions"
import TemplateVersionView from "@/components/library/template-version-view"

export default async function TemplateDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const template = await getTemplateDetails(params.id)

    if (!template) {
        return <div className="p-8">Template nicht gefunden.</div>
    }

    const { latestPublishedVersion, latestDraftVersion, versions } = processVersions(template)

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/dashboard/library">
                            <ChevronRight className="h-5 w-5 rotate-180" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-slate-900">{template.name}</h1>
                            {template.organization_id ? (
                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Eigenes Template</Badge>
                            ) : (
                                <Badge variant="outline" className="bg-slate-100 text-slate-600">System Standard</Badge>
                            )}
                        </div>
                        <p className="text-sm text-slate-500">
                            {template.category} • Erstellt am {new Date(template.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar: Version History */}
                <div className="w-80 border-r bg-white flex flex-col overflow-y-auto">
                    <div className="p-4 border-b bg-slate-50">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <History className="h-4 w-4" /> Versionen
                        </h3>
                    </div>
                    <div className="flex-1 p-2 space-y-2">
                        {versions.map((v: any) => (
                            <div key={v.id} className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-slate-800">v{v.version_number}.0</span>
                                    <StatusBadge status={v.status} />
                                </div>
                                <div className="text-xs text-slate-500">
                                    {v.published_at ? new Date(v.published_at).toLocaleDateString() : 'Work in Progress'}
                                </div>
                                {v.change_summary && (
                                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic">
                                        "{v.change_summary}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content: Version Viewer */}
                <div className="flex-1 overflow-y-auto bg-slate-100/50 p-6">
                    <TemplateVersionView
                        templateId={template.id}
                        initialVersion={latestDraftVersion || latestPublishedVersion}
                        hasDraft={!!latestDraftVersion}
                    />
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'published') return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Live</Badge>
    if (status === 'draft') return <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Draft</Badge>
    return <Badge variant="secondary">Archived</Badge>
}

// Helper: Determine key versions
function processVersions(template: any) {
    // If versions come pre-sorted descending from backend
    const sorted = template.versions?.sort((a: any, b: any) => b.version_number - a.version_number) || []
    return {
        latestPublishedVersion: sorted.find((v: any) => v.status === 'published'),
        latestDraftVersion: sorted.find((v: any) => v.status === 'draft'),
        versions: sorted
    }
}
