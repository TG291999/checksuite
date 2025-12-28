"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Layers, Kanban, Users, Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CheckSuiteLogo } from "@/components/brand/logo"
import { de } from "@/lib/i18n/de"

const navItems = [
    { name: de.common.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: de.common.processes, href: "/dashboard/library", icon: Layers },
    { name: de.common.boards, href: "/dashboard/boards", icon: Kanban },
    { name: de.common.team, href: "/dashboard/team", icon: Users },
    { name: de.common.settings, href: "/dashboard/settings", icon: Settings },
]

export function SidebarNav() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col border-r bg-white">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <CheckSuiteLogo height={32} />
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-3">
                <nav className="grid gap-1">
                    {navItems.map((item, index) => {
                        const Icon = item.icon
                        const isActive = item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href)

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-indigo-50 text-[#9146FF]"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="p-4 border-t">
                <Link href="/dashboard/library/new">
                    <Button className="w-full justify-start text-indigo-100 bg-[#9146FF] hover:bg-[#7e22ce]" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        {de.library.newTemplate}
                    </Button>
                </Link>
            </div>
        </div>
    )
}
