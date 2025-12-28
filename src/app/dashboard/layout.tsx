import { SidebarNav } from "@/components/dashboard/sidebar-nav"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <SidebarNav />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
