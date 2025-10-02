import { supabase } from './supabase';
import { Task } from './types';

// Transform database record to match frontend interface
function transformTaskRecord(record: any): Task {
  return {
    id: record.id,
    title: record.title,
    projectId: record.project_id,
    projectName: record.project_name,
    assigneeName: record.assignee_name,
    assigneeRole: record.assignee_role,
    assigneeAvatar: record.assignee_avatar,
    status: record.status,
    priority: record.priority,
    dueDate: record.due_date,
    progress: record.progress,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

// Transform frontend interface to database record format
function transformTaskToRecord(task: Partial<Task>) {
  return {
    title: task.title,
    project_id: task.projectId,
    project_name: task.projectName,
    assignee_name: task.assigneeName,
    assignee_role: task.assigneeRole,
    assignee_avatar: task.assigneeAvatar,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate,
    progress: task.progress,
  };
}

export async function getAllTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return data?.map(transformTaskRecord) || [];
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

export async function getTasksByAssignee(assigneeName: string): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee_name', assigneeName)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching tasks by assignee:', error);
      throw error;
    }

    return data?.map(transformTaskRecord) || [];
  } catch (error) {
    console.error('Error in getTasksByAssignee:', error);
    return [];
  }
}

