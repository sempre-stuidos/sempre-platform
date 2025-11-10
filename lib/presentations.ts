import { Presentation } from "./types"
import { supabase } from "./supabase"

export async function getAllPresentations(): Promise<Presentation[]> {
  const { data, error } = await supabase
    .from('presentations')
    .select(`
      *,
      clients!inner(name),
      team_members(name)
    `)
    .order('created_date', { ascending: false })

  if (error) {
    console.error('Error fetching presentations:', error)
    return []
  }

  return data.map(presentation => ({
    id: presentation.id,
    title: presentation.title,
    clientId: presentation.client_id,
    clientName: presentation.clients.name,
    type: presentation.type,
    createdDate: presentation.created_date,
    ownerId: presentation.owner_id,
    ownerName: presentation.team_members?.name || null,
    status: presentation.status,
    link: presentation.link,
    description: presentation.description,
    lastModified: presentation.last_modified,
    created_at: presentation.created_at,
    updated_at: presentation.updated_at
  }))
}

export async function getPresentationById(id: number): Promise<Presentation | null> {
  const { data, error } = await supabase
    .from('presentations')
    .select(`
      *,
      clients!inner(name),
      team_members(name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching presentation:', error)
    return null
  }

  return {
    id: data.id,
    title: data.title,
    clientId: data.client_id,
    clientName: data.clients.name,
    type: data.type,
    createdDate: data.created_date,
    ownerId: data.owner_id,
    ownerName: data.team_members?.name || null,
    status: data.status,
    link: data.link,
    description: data.description,
    lastModified: data.last_modified,
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}

export async function getPresentationsByClient(clientId: number): Promise<Presentation[]> {
  const { data, error } = await supabase
    .from('presentations')
    .select(`
      *,
      clients!inner(name),
      team_members(name)
    `)
    .eq('client_id', clientId)
    .order('created_date', { ascending: false })

  if (error) {
    console.error('Error fetching presentations by client:', error)
    return []
  }

  return data.map(presentation => ({
    id: presentation.id,
    title: presentation.title,
    clientId: presentation.client_id,
    clientName: presentation.clients.name,
    type: presentation.type,
    createdDate: presentation.created_date,
    ownerId: presentation.owner_id,
    ownerName: presentation.team_members?.name || null,
    status: presentation.status,
    link: presentation.link,
    description: presentation.description,
    lastModified: presentation.last_modified,
    created_at: presentation.created_at,
    updated_at: presentation.updated_at
  }))
}

export async function getPresentationsByType(type: Presentation['type']): Promise<Presentation[]> {
  const { data, error } = await supabase
    .from('presentations')
    .select(`
      *,
      clients!inner(name),
      team_members(name)
    `)
    .eq('type', type)
    .order('created_date', { ascending: false })

  if (error) {
    console.error('Error fetching presentations by type:', error)
    return []
  }

  return data.map(presentation => ({
    id: presentation.id,
    title: presentation.title,
    clientId: presentation.client_id,
    clientName: presentation.clients.name,
    type: presentation.type,
    createdDate: presentation.created_date,
    ownerId: presentation.owner_id,
    ownerName: presentation.team_members?.name || null,
    status: presentation.status,
    link: presentation.link,
    description: presentation.description,
    lastModified: presentation.last_modified,
    created_at: presentation.created_at,
    updated_at: presentation.updated_at
  }))
}

export async function getPresentationsByStatus(status: Presentation['status']): Promise<Presentation[]> {
  const { data, error } = await supabase
    .from('presentations')
    .select(`
      *,
      clients!inner(name),
      team_members(name)
    `)
    .eq('status', status)
    .order('created_date', { ascending: false })

  if (error) {
    console.error('Error fetching presentations by status:', error)
    return []
  }

  return data.map(presentation => ({
    id: presentation.id,
    title: presentation.title,
    clientId: presentation.client_id,
    clientName: presentation.clients.name,
    type: presentation.type,
    createdDate: presentation.created_date,
    ownerId: presentation.owner_id,
    ownerName: presentation.team_members?.name || null,
    status: presentation.status,
    link: presentation.link,
    description: presentation.description,
    lastModified: presentation.last_modified,
    created_at: presentation.created_at,
    updated_at: presentation.updated_at
  }))
}

export async function getPresentationsByOwner(ownerId: number): Promise<Presentation[]> {
  const { data, error } = await supabase
    .from('presentations')
    .select(`
      *,
      clients!inner(name),
      team_members(name)
    `)
    .eq('owner_id', ownerId)
    .order('created_date', { ascending: false })

  if (error) {
    console.error('Error fetching presentations by owner:', error)
    return []
  }

  return data.map(presentation => ({
    id: presentation.id,
    title: presentation.title,
    clientId: presentation.client_id,
    clientName: presentation.clients.name,
    type: presentation.type,
    createdDate: presentation.created_date,
    ownerId: presentation.owner_id,
    ownerName: presentation.team_members?.name || null,
    status: presentation.status,
    link: presentation.link,
    description: presentation.description,
    lastModified: presentation.last_modified,
    created_at: presentation.created_at,
    updated_at: presentation.updated_at
  }))
}

export async function createPresentation(presentationData: {
  title: string
  client_id: number
  type: Presentation['type'] | null
  status: Presentation['status'] | null
  link: string
  description?: string | null
  owner_id: number | null
  created_date: string
  last_modified: string
}): Promise<Presentation> {
  const { data, error } = await supabase
    .from('presentations')
    .insert([presentationData])
    .select(`
      *,
      clients!inner(name),
      team_members(name)
    `)
    .single()

  if (error) {
    console.error('Error creating presentation:', error)
    throw new Error('Failed to create presentation')
  }

  return {
    id: data.id,
    title: data.title,
    clientId: data.client_id,
    clientName: data.clients.name,
    type: data.type,
    createdDate: data.created_date,
    ownerId: data.owner_id,
    ownerName: data.team_members?.name || null,
    status: data.status,
    link: data.link,
    description: data.description,
    lastModified: data.last_modified,
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}

export async function updatePresentation(id: number, presentationData: {
  title: string
  client_id: number
  type: Presentation['type'] | null
  status: Presentation['status'] | null
  link: string
  description?: string | null
  owner_id: number | null
  last_modified: string
}): Promise<Presentation> {
  const { data, error } = await supabase
    .from('presentations')
    .update(presentationData)
    .eq('id', id)
    .select(`
      *,
      clients!inner(name),
      team_members(name)
    `)
    .single()

  if (error) {
    console.error('Error updating presentation:', error)
    throw new Error('Failed to update presentation')
  }

  return {
    id: data.id,
    title: data.title,
    clientId: data.client_id,
    clientName: data.clients.name,
    type: data.type,
    createdDate: data.created_date,
    ownerId: data.owner_id,
    ownerName: data.team_members?.name || null,
    status: data.status,
    link: data.link,
    description: data.description,
    lastModified: data.last_modified,
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}

export async function deletePresentation(id: number): Promise<void> {
  const { error } = await supabase
    .from('presentations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting presentation:', error)
    throw new Error('Failed to delete presentation')
  }
}

export async function getClients(): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }

  return data
}

export async function getTeamMembers(): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('id, name')
    .order('name')

  if (error) {
    console.error('Error fetching team members:', error)
    return []
  }

  return data
}

export async function getTeamMembersWithCurrentUser(currentUserId?: string): Promise<{ id: number; name: string; isCurrentUser?: boolean }[]> {
  const teamMembers = await getTeamMembers()
  
  // If we have a current user ID, mark the first team member as current user
  // In a real app, you'd want to create a proper team member record for the current user
  if (currentUserId && teamMembers.length > 0) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const fullName = authUser.user_metadata?.first_name && authUser.user_metadata?.last_name 
        ? `${authUser.user_metadata.first_name} ${authUser.user_metadata.last_name}`
        : authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'You'
      
      return teamMembers.map((member, index) => ({
        ...member,
        name: index === 0 ? `${fullName} (You)` : member.name,
        isCurrentUser: index === 0
      }))
    }
  }
  
  return teamMembers.map(member => ({ ...member, isCurrentUser: false }))
}

export function getPresentationStats(presentations: Presentation[]) {
  const total = presentations.length
  const byStatus = presentations.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const byType = presentations.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const recentPresentations = presentations
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 5)

  return {
    total,
    byStatus,
    byType,
    recentPresentations
  }
}
