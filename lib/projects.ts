import { supabase } from './supabase';
import { Project, TeamMember, ProjectTask, TimelineMilestone } from './types';

// Transform database record to match frontend interface
function transformProjectRecord(record: any, teamMembers: any[], tasks: any[], deliverables: any[], timeline: any[]): Project {
  return {
    id: record.id,
    name: record.name,
    clientId: record.client_id,
    clientName: record.client_name,
    status: record.status,
    dueDate: record.due_date,
    progress: record.progress,
    description: record.description,
    startDate: record.start_date,
    budget: record.budget,
    priority: record.priority,
    teamMembers: teamMembers.map(tm => ({
      id: tm.member_id,
      name: tm.name,
      role: tm.role,
      avatar: tm.avatar
    })),
    tasks: tasks.map(task => ({
      id: task.task_id,
      title: task.title,
      status: task.status,
      deliverable: task.deliverable
    })),
    deliverables: deliverables.map(d => d.deliverable),
    timeline: timeline.map(t => ({
      milestone: t.milestone,
      date: t.date,
      status: t.status
    })),
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

// Transform frontend interface to database record format
function transformProjectToRecord(project: Partial<Project>) {
  return {
    name: project.name,
    client_id: project.clientId,
    client_name: project.clientName,
    status: project.status,
    due_date: project.dueDate,
    progress: project.progress,
    description: project.description,
    start_date: project.startDate,
    budget: project.budget,
    priority: project.priority,
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
    const teamMembersByProject = (teamMembers || []).reduce((acc: any, tm: any) => {
      if (!acc[tm.project_id]) acc[tm.project_id] = [];
      acc[tm.project_id].push(tm);
      return acc;
    }, {});

    const tasksByProject = (tasks || []).reduce((acc: any, task: any) => {
      if (!acc[task.project_id]) acc[task.project_id] = [];
      acc[task.project_id].push(task);
      return acc;
    }, {});

    const deliverablesByProject = (deliverables || []).reduce((acc: any, d: any) => {
      if (!acc[d.project_id]) acc[d.project_id] = [];
      acc[d.project_id].push(d);
      return acc;
    }, {});

    const timelineByProject = (timeline || []).reduce((acc: any, t: any) => {
      if (!acc[t.project_id]) acc[t.project_id] = [];
      acc[t.project_id].push(t);
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

export async function createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project | null> {
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

    // Insert related data in parallel
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
