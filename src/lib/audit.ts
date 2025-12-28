import { createClient } from "@/lib/supabase/server"

export type AuditEventType =
    | 'PROCESS_START'
    | 'CARD_MOVE'
    | 'CHECKLIST_COMPLETE'
    | 'CHECKLIST_INCOMPLETE'
    | 'OVERRIDE_BLOCKER'
    | 'TEMPLATE_PUBLISH'

export async function logAuditEvent(
    organizationId: string,
    eventType: AuditEventType,
    entityType: 'board' | 'card' | 'step' | 'checklist_item' | 'template_version',
    entityId: string,
    metadata: any = {}
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Log asynchronously (fire and forget mostly, but we await to ensure it happens)
        // If we want high perf, we could skip await but Next.js server actions might kill it?
        // Safest is to await.

        await supabase.from('audit_events').insert({
            organization_id: organizationId,
            actor_id: user?.id,
            event_type: eventType,
            entity_type: entityType,
            entity_id: entityId,
            metadata: metadata,
            created_at: new Date().toISOString()
        })
    } catch (e) {
        console.error("Failed to log audit event:", e)
        // CheckSuite Philosophy: Audit failure shouldn't crash the app, but should be noted.
    }
}
