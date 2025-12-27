
import InvitePageContent from './invite-client'

interface PageProps {
    params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
    const { token } = await params
    return <InvitePageContent token={token} />
}
