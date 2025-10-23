import { supabase } from './supabase';
import { Project, TeamMember, ProjectTask, TimelineMilestone } from './types';

// Transform database record to match frontend interface
function transformProjectRecord(record: Record<string, unknown>, teamMembers: Record<string, unknown>[], tasks: Record<string, unknown>[], deliverables: Record<string, unknown>[], timeline: Record<string, unknown>[]): Project {
  return {
    id: record.id as number,
    name: record.name as string,
    clientId: record.client_id as number,
    clientName: record.client_name as string,
    status: record.status as "Planned" | "In Progress" | "Review" | "Completed",
    dueDate: record.due_date as string,
    description: record.description as string,
    startDate: record.start_date as string,
    budget: record.budget as number,
    priority: record.priority as "High" | "Medium" | "Low",
    progress: record.progress as number,
    teamMembers: teamMembers.map(tm => ({
      id: tm.member_id as number,
      name: tm.name as string,
      role: tm.role as string,
      status: "Active" as const,
      email: tm.email as string || "",
      timezone: tm.timezone as string || "UTC",
      avatar: tm.avatar as string
    })),
    tasks: tasks.map(task => ({
      id: task.task_id as number,
      title: task.title as string,
      status: task.status as "completed" | "in-progress" | "pending",
      deliverable: task.deliverable as string
    })),
    deliverables: deliverables.map(d => d.deliverable as string),
    timeline: timeline.map(t => ({
      milestone: t.milestone as string,
      date: t.date as string,
      status: t.status as "completed" | "in-progress" | "pending"
    })),
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformProjectToRecord(project: Partial<Project>) {
  return {
    name: project.name, // Required field - should not be null
    client_id: project.clientId && project.clientId !== 0 ? project.clientId : null,
    client_name: project.clientName || null,
    status: project.status || null,
    due_date: project.dueDate || null,
    description: project.description || null,
    start_date: project.startDate || null,
    budget: project.budget || 0,
    priority: project.priority || null,
  };
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    // Fetch projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('id', { ascending: true });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    if (!projects || projects.length === 0) {
      return [];
    }

    // Fetch all related data in parallel
    const projectIds = projects.map(p => p.id);
    
    const [
      { data: teamMembers },
      { data: tasks },
      { data: deliverables },
      { data: timeline }
    ] = await Promise.all([
      supabase.from('project_team_members').select('*').in('project_id', projectIds),
      supabase.from('project_tasks').select('*').in('project_id', projectIds),
      supabase.from('project_deliverables').select('*').in('project_id', projectIds),
      supabase.from('project_timeline').select('*').in('project_id', projectIds)
    ]);

    // Group related data by project_id
    const teamMembersByProject = (teamMembers || []).reduce((acc: Record<string, Record<string, unknown>[]>, tm: Record<string, unknown>) => {
      const projectId = tm.project_id as string;
      if (!acc[projectId]) acc[projectId] = [];
      acc[projectId].push(tm);
      return acc;
    }, {});

    const tasksByProject = (tasks || []).reduce((acc: Record<string, Record<string, unknown>[]>, task: Record<string, unknown>) => {
      const projectId = task.project_id as string;
      if (!acc[projectId]) acc[projectId] = [];
      acc[projectId].push(task);
      return acc;
    }, {});

    const deliverablesByProject = (deliverables || []).reduce((acc: Record<string, Record<string, unknown>[]>, d: Record<string, unknown>) => {
      const projectId = d.project_id as string;
      if (!acc[projectId]) acc[projectId] = [];
      acc[projectId].push(d);
      return acc;
    }, {});

    const timelineByProject = (timeline || []).reduce((acc: Record<string, Record<string, unknown>[]>, t: Record<string, unknown>) => {
      const projectId = t.project_id as string;
      if (!acc[projectId]) acc[projectId] = [];
      acc[projectId].push(t);
      return acc;
    }, {});

    return projects.map(project => 
      transformProjectRecord(
        project,
        teamMembersByProject[project.id] || [],
        tasksByProject[project.id] || [],
        deliverablesByProject[project.id] || [],
        timelineByProject[project.id] || []
      )
    );
  } catch (error) {
    console.error('Error in getAllProjects:', error);
    return [];
  }
}

export async function getProjectById(id: number): Promise<Project | null> {
  try {
    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      throw projectError;
    }

    if (!project) {
      return null;
    }

    // Fetch all related data in parallel
    const [
      { data: teamMembers },
      { data: tasks },
      { data: deliverables },
      { data: timeline }
    ] = await Promise.all([
      supabase.from('project_team_members').select('*').eq('project_id', id),
      supabase.from('project_tasks').select('*').eq('project_id', id),
      supabase.from('project_deliverables').select('*').eq('project_id', id),
      supabase.from('project_timeline').select('*').eq('project_id', id)
    ]);

    return transformProjectRecord(
      project,
      teamMembers || [],
      tasks || [],
      deliverables || [],
      timeline || []
    );
  } catch (error) {
    console.error('Error in getProjectById:', error);
    return null;
  }
}

export async function createProject(project: Partial<Project>): Promise<Project | null> {
  try {
    // Insert project
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert([transformProjectToRecord(project)])
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      throw projectError;
    }

    if (!newProject) {
      return null;
    }

    const projectId = newProject.id;

    // Insert related data in parallel (only if they exist)
    const insertPromises = [];

    if (project.teamMembers && project.teamMembers.length > 0) {
      const teamMembersData = project.teamMembers.map(tm => ({
        project_id: projectId,
        member_id: tm.id,
        name: tm.name,
        role: tm.role,
        avatar: tm.avatar
      }));
      insertPromises.push(
        supabase.from('project_team_members').insert(teamMembersData)
      );
    }

    if (project.tasks && project.tasks.length > 0) {
      const tasksData = project.tasks.map(task => ({
        project_id: projectId,
        task_id: task.id,
        title: task.title,
        status: task.status,
        deliverable: task.deliverable
      }));
      insertPromises.push(
        supabase.from('project_tasks').insert(tasksData)
      );
    }

    if (project.deliverables && project.deliverables.length > 0) {
      const deliverablesData = project.deliverables.map(deliverable => ({
        project_id: projectId,
        deliverable
      }));
      insertPromises.push(
        supabase.from('project_deliverables').insert(deliverablesData)
      );
    }

    if (project.timeline && project.timeline.length > 0) {
      const timelineData = project.timeline.map(t => ({
        project_id: projectId,
        milestone: t.milestone,
        date: t.date,
        status: t.status
      }));
      insertPromises.push(
        supabase.from('project_timeline').insert(timelineData)
      );
    }

    await Promise.all(insertPromises);

    // Return the complete project with all related data
    return await getProjectById(projectId);
  } catch (error) {
    console.error('Error in createProject:', error);
    return null;
  }
}

export async function updateProject(id: number, updates: Partial<Project>): Promise<Project | null> {
  try {
    // Update project
    const { data: updatedProject, error: projectError } = await supabase
      .from('projects')
      .update(transformProjectToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (projectError) {
      console.error('Error updating project:', projectError);
      throw projectError;
    }

    // Return the complete project with all related data
    return await getProjectById(id);
  } catch (error) {
    console.error('Error in updateProject:', error);
    return null;
  }
}

export async function deleteProject(id: number): Promise<boolean> {
  try {
    // Delete project (cascading deletes will handle related data)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProject:', error);
    return false;
  }
}

export async function getProjectsByStatus(status: 'Completed' | 'In Progress' | 'Review' | 'Planned'): Promise<Project[]> {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', status)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching projects by status:', error);
      throw error;
    }

    if (!projects || projects.length === 0) {
      return [];
    }

    // For filtered results, we can return simplified data without all relations
    // or fetch full data if needed
    return projects.map(project => 
      transformProjectRecord(project, [], [], [], [])
    );
  } catch (error) {
    console.error('Error in getProjectsByStatus:', error);
    return [];
  }
}

export async function getProjectsByPriority(priority: 'High' | 'Medium' | 'Low'): Promise<Project[]> {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('priority', priority)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching projects by priority:', error);
      throw error;
    }

    if (!projects || projects.length === 0) {
      return [];
    }

    return projects.map(project => 
      transformProjectRecord(project, [], [], [], [])
    );
  } catch (error) {
    console.error('Error in getProjectsByPriority:', error);
    return [];
  }
}
