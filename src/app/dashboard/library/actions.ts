'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

// TYPES
export type TemplateFilter = 'all' | 'organization' | 'system' | 'favorites'

// --- FETCHING ---

export async function getProcessTemplates(
    filter: TemplateFilter = 'all',
    searchQuery?: string,
    category?: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get user's org
    const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    // Get favorites
    const { data: favorites } = await supabase
        .from('template_favorites')
        .select('template_id')
        .eq('user_id', user.id)

    const favoriteIds = new Set(favorites?.map(f => f.template_id))

    const orgId = member?.workspace_id

    let query = supabase
        .from('process_templates')
        .select(`
            *,
            versions:process_template_versions(
                id, version_number, status, published_at, created_at, change_summary
            )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (filter === 'organization' && orgId) {
        query = query.eq('organization_id', orgId)
    } else if (filter === 'system') {
        query = query.is('organization_id', null)
    } else if (filter === 'favorites') { // Handle 'favorites' filter
        // We can't easily filter by "IN" array with OR check for Org vs System in one go elegantly in simple Supabase query builder without splitting logic
        // But we can filter in memory if list is small, or use .in()
        if (favoriteIds.size > 0) {
            query = query.in('id', Array.from(favoriteIds))
        } else {
            return [] // No favorites
        }
    } else if (orgId) {
        // 'all': System (null) OR My Org
        query = query.or(`organization_id.eq.${orgId},organization_id.is.null`)
    } else {
        query = query.is('organization_id', null)
    }

    if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
    }

    if (category && category !== 'all') {
        query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching templates:', error)
        return []
    }

    // Process versions
    return data.map((t: any) => {
        const sortedVersions = t.versions?.sort((a: any, b: any) => b.version_number - a.version_number) || []
        const latestPublished = sortedVersions.find((v: any) => v.status === 'published')
        const latestDraft = sortedVersions.find((v: any) => v.status === 'draft')

        return {
            ...t,
            latestPublishedVersion: latestPublished,
            latestDraftVersion: latestDraft,
            versionCount: sortedVersions.length,
            isFavorite: favoriteIds.has(t.id)
        }
    })
}

export async function toggleTemplateFavorite(templateId: string, isFavorite: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (isFavorite) {
        await supabase.from('template_favorites').insert({ user_id: user.id, template_id: templateId })
    } else {
        await supabase.from('template_favorites').delete().eq('user_id', user.id).eq('template_id', templateId)
    }
    revalidatePath('/dashboard/library')
}

export async function getTemplateDetails(templateId: string) {
    const supabase = await createClient()

    // Fetch Template + all Versions + Steps of latest draft/published
    // Note: fetching deep steps for ALL versions is heavy. Usually we fetch template + versions list first.
    // Then fetch specific version details on demand.

    const { data: template, error } = await supabase
        .from('process_templates')
        .select(`
            *,
            versions:process_template_versions(
                id, version_number, status, published_at, change_summary
            )
        `)
        .eq('id', templateId)
        .single()

    if (error) return null
    return template
}

export async function getVersionDetails(versionId: string) {
    const supabase = await createClient()

    const { data: version, error } = await supabase
        .from('process_template_versions')
        .select(`
            *,
            steps:template_steps(
                id, name, description, position, require_checklist_complete,
                items:template_checklist_items(id, content, position)
            )
        `)
        .eq('id', versionId)
        .single()

    if (error) return null

    // Sort steps and items
    if (version.steps) {
        version.steps.sort((a: any, b: any) => a.position - b.position)
        version.steps.forEach((s: any) => {
            if (s.items) s.items.sort((i: any, j: any) => i.position - j.position)
        })
    }

    return version
}


// --- ACTIONS (Admin Only) ---

export async function createProcessTemplate(name: string, description: string, category: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get Org & Check Role
    const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        throw new Error('Permission denied')
    }

    // 1. Create Template
    const { data: template, error: tError } = await supabase
        .from('process_templates')
        .insert({
            organization_id: member.workspace_id,
            name,
            description,
            category,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000), // temp slug
            created_at: new Date().toISOString()
        })
        .select()
        .single()

    if (tError) throw new Error(tError.message)

    // 2. Create Draft Version 1.0
    const { error: vError } = await supabase
        .from('process_template_versions')
        .insert({
            template_id: template.id,
            version_number: 1,
            status: 'draft',
            created_by: user.id
        })

    if (vError) throw new Error(vError.message)

    revalidatePath('/dashboard/library')
    return template.id
}

export async function publishTemplateVersion(versionId: string, summary: string) {
    const supabase = await createClient()
    // Verify RLS will handle auth checks, generally safe to just run update
    // But we should verify user role explicitly for better UX messaging
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
        .from('process_template_versions')
        .update({
            status: 'published',
            published_at: new Date().toISOString(),
            change_summary: summary
        })
        .eq('id', versionId)

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/library')
}

export async function createNewDraft(templateId: string) {
    // Finds latest version, duplicates it as new draft
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Get max version
    const { data: versions } = await supabase
        .from('process_template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false })
        .limit(1)

    if (!versions?.length) throw new Error('Template not found')
    const latest = versions[0]

    // 2. Clone to new Version
    const newVerNum = latest.version_number + 1

    const { data: newVersion, error: vError } = await supabase
        .from('process_template_versions')
        .insert({
            template_id: templateId,
            version_number: newVerNum,
            status: 'draft',
            created_by: user?.id
        })
        .select()
        .single()

    if (vError) throw new Error(vError.message)

    // 3. Deep Copy Steps & Items from Latest
    // This is "Deep Clone" logic.
    // Ideally done via Postgres Function for atomicity, but TS loop is okay for low volume.

    // Fetch old structure
    const oldStructure = await getVersionDetails(latest.id)
    if (oldStructure?.steps) {
        for (const step of oldStructure.steps) {
            // Copy Step
            const { data: newStep } = await supabase
                .from('template_steps')
                .insert({
                    version_id: newVersion.id, // Linking to NEW version
                    name: step.name,
                    description: step.description,
                    position: step.position,
                    require_checklist_complete: step.require_checklist_complete
                })
                .select()
                .single()

            if (newStep && step.items) {
                // Copy Items
                const itemsToInsert = step.items.map((i: any) => ({
                    step_id: newStep.id,
                    content: i.content,
                    position: i.position
                }))
                if (itemsToInsert.length > 0) {
                    await supabase.from('template_checklist_items').insert(itemsToInsert)
                }
            }
        }
    }

    revalidatePath('/dashboard/library')
    return newVersion.id
}

// --- INSTANTIATION (AP27 + AP29 Compliance) ---

export async function startProcessFromTemplate(
    templateId: string,
    versionId: string,
    assigneeUserId: string,
    processName: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Get User's Workspace
    const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()

    if (!member) throw new Error('User has no workspace')

    // 2. Fetch Version Details (Structure)
    const version = await getVersionDetails(versionId)
    if (!version) throw new Error('Template version not found')

    // 3. Create Board (The Process Instance)
    const { data: board, error: bError } = await supabase
        .from('boards')
        .insert({
            workspace_id: member.workspace_id,
            name: processName, // e.g. "Onboarding Müller GmbH"
            origin_template_id: templateId,
            origin_template_version_id: versionId,
            is_structure_locked: true // Enforce AP27 rule
        })
        .select()
        .single()

    if (bError) throw new Error(bError.message)

    // 4. Create Structure (Columns -> Cards -> Items)
    if (version.steps && version.steps.length > 0) {

        for (const step of version.steps) {
            // A) Create Column (Phase)
            const { data: column, error: cError } = await supabase
                .from('columns')
                .insert({
                    board_id: board.id,
                    name: step.name,
                    position: step.position,
                    requires_task_completion: step.require_checklist_complete ?? false
                })
                .select()
                .single()

            if (cError) console.error('Error creating column', cError)

            if (column) {
                // AP27 Decision: Create a "Main Card" for this phase named after the step.
                // This card holds the checklist items.

                if (step.items && step.items.length > 0) {
                    const { data: card, error: cardError } = await supabase
                        .from('cards')
                        .insert({
                            column_id: column.id,
                            title: step.name, // Card has same name as Phase
                            // description: step.description, // Optional
                            assigned_to: assigneeUserId, // The responsible person
                            position: 0
                        })
                        .select()
                        .single()

                    if (card && !cardError) {
                        const itemsToInsert = step.items.map((i: any) => ({
                            card_id: card.id,
                            content: i.content,
                            position: i.position,
                            is_completed: false
                        }))
                        await supabase.from('checklist_items').insert(itemsToInsert)
                    }
                }
            }
        }
    }

    revalidatePath('/dashboard')
    return board.id
}

export async function getWorkspaceMembers() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // 1. Get Org
    const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return []

    // 2. Fetch Members Table
    const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', member.workspace_id)

    if (!members || members.length === 0) return []

    // 3. Fetch Emails via Admin
    const adminSupabase = createAdminClient()
    const { data: { users } } = await adminSupabase.auth.admin.listUsers()

    const userMap = new Map<string, string>()
    if (users) {
        users.forEach((u: any) => userMap.set(u.id, u.email || 'Unbekannt'))
    }

    // 4. Map to Simple Object
    return members.map(m => ({
        userId: m.user_id,
        email: userMap.get(m.user_id) || 'Unbekannt'
    }))
}
