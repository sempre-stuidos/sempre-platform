import { supabase, supabaseAdmin } from './supabase';
import { Task } from './types';

// Helper function to get assignee info from user_roles.id
async function getAssigneeInfoFromRoleId(roleId: number | null): Promise<{
  name: string | null;
  role: string | null;
  avatar: string | null;
}> {
  if (!roleId) {
    return { name: null, role: null, avatar: null };
  }
  
  try {
    const { data: userRole, error } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role, invited_email')
      .eq('id', roleId)
      .single();
    
    if (error || !userRole || !userRole.user_id) {
      return {
        name: userRole?.invited_email || null,
        role: userRole?.role || null,
        avatar: null,
      };
    }
    
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userRole.user_id);
    if (userData?.user) {
      const metadata = userData.user.user_metadata || {};
      return {
        name: metadata.full_name || metadata.name || userData.user.email?.split('@')[0] || null,
        role: userRole.role,
        avatar: metadata.avatar_url || metadata.picture || null,
      };
    }
    
    return {
      name: userRole.invited_email || null,
      role: userRole.role,
      avatar: null,
    };
  } catch (error) {
    console.error('Error fetching assignee info:', error);
    return { name: null, role: null, avatar: null };
  }
}

// Transform database record to match frontend interface
function transformTaskRecord(record: Record<string, unknown>): Task {
  return {
    id: record.id as number,
    title: record.title as string,
    projectId: record.project_id as number,
    assigneeId: record.assignee_id as number | null,
    status: record.status as "To Do" | "In Progress" | "Review" | "Done",
    priority: record.priority as "High" | "Medium" | "Low",
    dueDate: record.due_date as string,
    progress: record.progress as number,
    // Derived fields will be populated from joins in the calling function
    projectName: undefined,
    assigneeName: undefined,
    assigneeRole: undefined,
    assigneeAvatar: undefined,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformTaskToRecord(task: Partial<Task>) {
  return {
    title: task.title,
    project_id: task.projectId,
    assignee_id: task.assigneeId,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
  };
}

export async function getAllTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects!project_id(name)
      `)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch assignee info for all tasks in parallel
    const assigneeInfos = await Promise.all(
      data.map(record => getAssigneeInfoFromRoleId(record.assignee_id as number | null))
    );

    return data.map((record, index) => ({
      ...transformTaskRecord(record),
      projectName: record.projects?.name,
      assigneeName: assigneeInfos[index].name,
      assigneeRole: assigneeInfos[index].role,
      assigneeAvatar: assigneeInfos[index].avatar,
    }));
  } catch (error) {
    console.error('Error in getAllTasks:', error);
    return [];
  }
}

export async function getTaskById(id: number): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      throw error;
    }

    return data ? transformTaskRecord(data) : null;
  } catch (error) {
    console.error('Error in getTaskById:', error);
    return null;
  }
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([transformTaskToRecord(task)])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      throw error;
    }

    return data ? transformTaskRecord(data) : null;
  } catch (error) {
    console.error('Error in createTask:', error);
    return null;
  }
}

export async function updateTask(id: number, updates: Partial<Task>): Promise<Task | null> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(transformTaskToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }

    return data ? transformTaskRecord(data) : null;
  } catch (error) {
    console.error('Error in updateTask:', error);
    return null;
  }
}

export async function deleteTask(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTask:', error);
    return false;
  }
}

export async function getTasksByStatus(status: 'To Do' | 'In Progress' | 'Review' | 'Done'): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching tasks by status:', error);
      throw error;
    }

    return data?.map(transformTaskRecord) || [];
  } catch (error) {
    console.error('Error in getTasksByStatus:', error);
    return [];
  }
}

export async function getTasksByPriority(priority: 'High' | 'Medium' | 'Low'): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('priority', priority)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching tasks by priority:', error);
      throw error;
    }

    return data?.map(transformTaskRecord) || [];
  } catch (error) {
    console.error('Error in getTasksByPriority:', error);
    return [];
  }
}

export async function getTasksByProjectId(projectId: number): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching tasks by project:', error);
      throw error;
    }

    return data?.map(transformTaskRecord) || [];
  } catch (error) {
    console.error('Error in getTasksByProjectId:', error);
    return [];
  }
}

export async function getTasksByAssignee(assigneeId: number): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects!project_id(name)
      `)
      .eq('assignee_id', assigneeId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching tasks by assignee:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch assignee info for all tasks in parallel
    const assigneeInfos = await Promise.all(
      data.map(record => getAssigneeInfoFromRoleId(record.assignee_id as number | null))
    );

    return data.map((record, index) => ({
      ...transformTaskRecord(record),
      projectName: record.projects?.name,
      assigneeName: assigneeInfos[index].name,
      assigneeRole: assigneeInfos[index].role,
      assigneeAvatar: assigneeInfos[index].avatar,
    }));
  } catch (error) {
    console.error('Error in getTasksByAssignee:', error);
    return [];
  }
}

// Helper functions for dropdowns
export async function getAllProjects(): Promise<{id: number, name: string}[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllProjects:', error);
    return [];
  }
}

export async function getAllTeamMembers(): Promise<{id: number, name: string, role: string, avatar?: string}[]> {
  try {
    // Import from team.ts to use the new user_roles-based implementation
    const { getAllTeamMembers: getTeamMembers } = await import('./team');
    const teamMembers = await getTeamMembers();
    
    return teamMembers.map(member => ({
      id: member.id,
      name: member.name || 'Unknown',
      role: member.role,
      avatar: member.avatar,
    }));
  } catch (error) {
    console.error('Error in getAllTeamMembers:', error);
    return [];
  }
}

