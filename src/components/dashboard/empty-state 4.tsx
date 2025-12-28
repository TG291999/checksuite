import { FileStack } from 'lucide-react'

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description: string
    children?: React.ReactNode
}

export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
    return (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                {icon || <FileStack className="h-8 w-8 text-primary" />}
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {title}
            </h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto text-base leading-relaxed">
                {description}
            </p>
            {children && (
                <div className="flex gap-3 justify-center">
                    {children}
                </div>
            )}
        </div>
    )
}
