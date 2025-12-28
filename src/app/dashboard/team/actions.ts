'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getOrganizationRoles() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single()

    if (!member) return []

    const { data: roles } = await supabase
        .from('organization_roles')
        .select('*')
        .eq('organization_id', member.workspace_id)
        .order('name')

    return roles || []
}

export async function createOrganizationRole(name: string, color: string = '#64748b') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get Org
    const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        throw new Error('Only admins can create roles')
    }

    const { error } = await supabase
        .from('organization_roles')
        .insert({
            organization_id: member.workspace_id,
            name,
            color
        })

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/team')
}

export async function deleteOrganizationRole(roleId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Check Admin (simplified check, real app should be strict)
    const { data: member } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('user_id', user.id)
        .single()

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        throw new Error('Only admins can delete roles')
    }

    const { error } = await supabase
        .from('organization_roles')
        .delete()
        .eq('id', roleId)

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/team')
}

export async function assignRoleToMember(targetUserId: string, roleId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify Admin
    const { data: manager } = await supabase
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', user.id)
        .single()

    if (!manager || (manager.role !== 'owner' && manager.role !== 'admin')) {
        throw new Error('Only admins can assign roles')
    }

    // Assign
    const { error } = await supabase
        .from('workspace_members')
        .update({ functional_role_id: roleId })
        .eq('user_id', targetUserId)
        .eq('workspace_id', manager.workspace_id) // Ensure same org

    if (error) throw new Error(error.message)
    revalidatePath('/dashboard/team')
}
