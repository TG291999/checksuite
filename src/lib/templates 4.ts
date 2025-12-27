// Template Types & Data Fetcher
// AP11: Process Templates

import { createClient } from '@/lib/supabase/server'

export interface TemplateChecklistItem {
    id: string
    content: string
    position: number
}

export interface TemplateStep {
    id: string
    name: string
    description: string | null
    position: number
    require_checklist_complete: boolean
    template_checklist_items: TemplateChecklistItem[]
}

export interface ProcessTemplate {
    id: string
    slug: string
    name: string
    description: string | null
    icon: string | null
    category: string | null
    template_steps: TemplateStep[]
}

export interface TemplateListItem {
    id: string
    slug: string
    name: string
    description: string | null
    icon: string | null
    category: string | null
}

/**
 * Fetch all active templates (list view, no steps)
 */
export async function getTemplates(): Promise<TemplateListItem[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('process_templates')
        .select('id, slug, name, description, icon, category')
        .eq('is_active', true)
        .order('name')

    if (error) {
        console.error('Error fetching templates:', error)
        return []
    }

    return data || []
}

/**
 * Fetch a single template with all steps and checklist items
 */
export async function getTemplateBySlug(slug: string): Promise<ProcessTemplate | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('process_templates')
        .select(`
            id,
            slug,
            name,
            description,
            icon,
            category,
            template_steps (
                id,
                name,
                description,
                position,
                require_checklist_complete,
                template_checklist_items (
                    id,
                    content,
                    position
                )
            )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (error) {
        console.error('Error fetching template:', error)
        return null
    }

    // Sort steps and checklist items by position
    if (data?.template_steps) {
        data.template_steps.sort((a: any, b: any) => a.position - b.position)
        data.template_steps.forEach((step: any) => {
            if (step.template_checklist_items) {
                step.template_checklist_items.sort((a: any, b: any) => a.position - b.position)
            }
        })
    }

    return data as ProcessTemplate
}

/**
 * Fetch a template by ID
 */
export async function getTemplateById(id: string): Promise<ProcessTemplate | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('process_templates')
        .select(`
            id,
            slug,
            name,
            description,
            icon,
            category,
            template_steps (
                id,
                name,
                description,
                position,
                require_checklist_complete,
                template_checklist_items (
                    id,
                    content,
                    position
                )
            )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

    if (error) {
        console.error('Error fetching template by ID:', error)
        return null
    }

    // Sort steps and checklist items by position
    if (data?.template_steps) {
        data.template_steps.sort((a: any, b: any) => a.position - b.position)
        data.template_steps.forEach((step: any) => {
            if (step.template_checklist_items) {
                step.template_checklist_items.sort((a: any, b: any) => a.position - b.position)
            }
        })
    }

    return data as ProcessTemplate
}
