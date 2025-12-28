import { getBoards } from "./actions"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Lock, Layout, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CreateBoardDialog } from "./create-board-dialog-wrapper" // Wrapper for client component
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { de } from '@/lib/i18n/de'

export default async function BoardsPage() {
    const boards = await getBoards()

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{de.boards.title}</h2>
                    <p className="text-muted-foreground">
                        {de.boards.subtitle}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <CreateBoardDialog />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {boards.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-slate-50 border border-dashed rounded-lg">
                        <p className="text-slate-500 mb-4">{de.boards.empty}</p>
                        <CreateBoardDialog />
                    </div>
                ) : (
                    boards.map((board: any) => ( // Explicit any to avoid TS issues for now
                        <BoardCard key={board.id} board={board} />
                    ))
                )}
            </div>
        </div>
    )
}

function BoardCard({ board }: { board: any }) {
    return (
        <Link href={`/boards/${board.id}`}>
            <Card className="h-full hover:shadow-md transition-shadow group cursor-pointer relative">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg group-hover:text-[#6D28D9] transition-colors">{board.name}</CardTitle>
                        {board.is_structure_locked ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Lock className="h-4 w-4 text-slate-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{de.boards.lockedTooltip}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <Layout className="h-4 w-4 text-slate-300" />
                        )}
                    </div>
                    {board.origin_template && (
                        <CardDescription className="text-xs flex items-center gap-1 mt-1">
                            <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                                Process: {board.origin_template.name} v{board.origin_version?.version_number}
                            </Badge>
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-xs text-slate-500">
                        Erstellt am {new Date(board.created_at).toLocaleDateString()}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
