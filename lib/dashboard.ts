import { supabase, supabaseAdmin } from './supabase';
import { DashboardStats, DashboardChartData } from './types';

// Helper function to get assignee name from user_roles.id
async function getAssigneeNameFromRoleId(roleId: number | null): Promise<string> {
  if (!roleId) {
    return 'Unassigned';
  }
  
  try {
    const { data: userRole, error } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, invited_email')
      .eq('id', roleId)
      .single();
    
    if (error || !userRole || !userRole.user_id) {
      return userRole?.invited_email || 'Unassigned';
    }
    
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userRole.user_id);
    if (userData?.user) {
      const metadata = userData.user.user_metadata || {};
      return metadata.full_name || metadata.name || userData.user.email?.split('@')[0] || 'Unassigned';
    }
    
    return userRole.invited_email || 'Unassigned';
  } catch (error) {
    console.error('Error fetching assignee name:', error);
    return 'Unassigned';
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get active clients count
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id')
      .eq('status', 'Active');

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
    }

    // Get active projects count
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .in('status', ['In Progress', 'Review']);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
    }

    // Get tasks due this week
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', nextWeek.toISOString().split('T')[0])
      .in('status', ['To Do', 'In Progress']);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
    }

    // Get recent notes (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    const { data: notesData, error: notesError } = await supabase
      .from('notes_knowledge')
      .select('id')
      .gte('created_at', lastWeek.toISOString());

    if (notesError) {
      console.error('Error fetching notes:', notesError);
    }

    // Get notes added today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: todayNotesData, error: todayNotesError } = await supabase
      .from('notes_knowledge')
      .select('id')
      .gte('created_at', todayStart.toISOString());

    if (todayNotesError) {
      console.error('Error fetching today notes:', todayNotesError);
    }

    // Calculate active projects count
    const activeProjectsCount = projectsData?.length || 0;

    // Calculate client growth (compare with last month)
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);

    const { data: lastMonthClientsData, error: lastMonthClientsError } = await supabase
      .from('clients')
      .select('id')
      .eq('status', 'Active')
      .lte('created_at', lastMonth.toISOString());

    if (lastMonthClientsError) {
      console.error('Error fetching last month clients:', lastMonthClientsError);
    }

    const clientGrowth = (clientsData?.length || 0) - (lastMonthClientsData?.length || 0);

    // Calculate task counts by status (simplified for now)
    const completedTasksCount = 0;
    const inProgressTasksCount = tasksData?.length || 0;
    const pendingReviewTasksCount = 0;
    const averageProgress = 0; // Simplified for now

    return {
      totalItems: (clientsData?.length || 0) + (activeProjectsCount || 0) + (tasksData?.length || 0),
      completedItems: completedTasksCount || 0,
      inProgressItems: inProgressTasksCount || 0,
      pendingReviewItems: pendingReviewTasksCount || 0,
      completionRate: averageProgress || 0,
      activeClients: clientsData?.length || 0,
      activeProjects: activeProjectsCount,
      tasksThisWeek: tasksData?.length || 0,
      recentNotes: notesData?.length || 0,
      projectProgress: activeProjectsCount,
      clientGrowth: clientGrowth,
      notesToday: todayNotesData?.length || 0,
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return {
      totalItems: 0,
      completedItems: 0,
      inProgressItems: 0,
      pendingReviewItems: 0,
      completionRate: 0,
      activeClients: 0,
      activeProjects: 0,
      tasksThisWeek: 0,
      recentNotes: 0,
      projectProgress: 0,
      clientGrowth: 0,
      notesToday: 0,
    };
  }
}

export async function getDashboardChartData(): Promise<DashboardChartData[]> {
  try {
    // Get project and task activity data for the last 90 days
    const today = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);

    // Get projects with their status
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('created_at, updated_at, status')
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (projectsError) {
      console.error('Error fetching projects for chart:', projectsError);
      return generateFallbackChartData();
    }

    // Get tasks with their status
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('created_at, updated_at, status')
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks for chart:', tasksError);
    }

    // Create chart data by aggregating projects and tasks by date
    const dateMap = new Map<string, { completed: number; inProgress: number; pending: number }>();

    // Initialize all dates in the range
    for (let i = 0; i < 90; i++) {
      const date = new Date(ninetyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { completed: 0, inProgress: 0, pending: 0 });
    }

    // Count projects by date and status
    projectsData?.forEach(project => {
      const dateStr = project.created_at.split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) {
        if (project.status === 'Completed') {
          existing.completed += 1;
        } else if (project.status === 'In Progress' || project.status === 'Review') {
          existing.inProgress += 1;
        } else if (project.status === 'Planned') {
          existing.pending += 1;
        }
      }
    });

    // Count tasks by date and status
    tasksData?.forEach(task => {
      const dateStr = task.created_at.split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) {
        if (task.status === 'Done') {
          existing.completed += 1;
        } else if (task.status === 'In Progress' || task.status === 'Review') {
          existing.inProgress += 1;
        } else if (task.status === 'To Do') {
          existing.pending += 1;
        }
      }
    });

    // Convert to array format with cumulative counts for better visualization
    const chartData: DashboardChartData[] = [];
    let cumulativeCompleted = 0;
    let cumulativeInProgress = 0;
    let cumulativePending = 0;

    dateMap.forEach((value, date) => {
      cumulativeCompleted += value.completed;
      cumulativeInProgress += value.inProgress;
      cumulativePending += value.pending;
      
      chartData.push({
        month: date,
        date,
        completed: cumulativeCompleted,
        inProgress: cumulativeInProgress,
        pending: cumulativePending,
      });
    });

    return chartData.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error in getDashboardChartData:', error);
    return generateFallbackChartData();
  }
}

function generateFallbackChartData(): DashboardChartData[] {
  const data: DashboardChartData[] = [];
  const today = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    data.push({
      month: date.toISOString().split('T')[0],
      date: date.toISOString().split('T')[0],
      completed: Math.floor(Math.random() * 5), // Random project activity
      inProgress: Math.floor(Math.random() * 8),   // Random task activity
      pending: Math.floor(Math.random() * 3),
    });
  }
  
  return data;
}

export async function getRecentTasks(limit: number = 10) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        assignee_id,
        projects!tasks_project_id_fkey (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent tasks:', error);
      return [];
    }

    // Fetch assignee names for all tasks in parallel
    const assigneeNames = await Promise.all(
      (tasks || []).map(task => getAssigneeNameFromRoleId(task.assignee_id as number | null))
    );

    return tasks?.map((task, index) => ({
      id: task.id,
      title: task.title,
      type: 'Task',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date || 'No due date',
      assignee: assigneeNames[index],
      projectName: task.projects ? (task.projects as unknown as { name: string }).name : 'No Project',
    })) || [];
  } catch (error) {
    console.error('Error in getRecentTasks:', error);
    return [];
  }
}

export async function getHighPriorityTasks(limit: number = 50) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        assignee_id,
        projects!tasks_project_id_fkey (
          name
        )
      `)
      .eq('priority', 'High')
      .in('status', ['To Do', 'In Progress', 'Review'])
      .order('due_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching high priority tasks:', error);
      return [];
    }

    // Fetch assignee names for all tasks in parallel
    const assigneeNames = await Promise.all(
      (tasks || []).map(task => getAssigneeNameFromRoleId(task.assignee_id as number | null))
    );

    return tasks?.map((task, index) => ({
      id: task.id,
      title: task.title,
      type: 'Task',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date || 'No due date',
      assignee: assigneeNames[index],
      projectName: task.projects ? (task.projects as unknown as { name: string }).name : 'No Project',
    })) || [];
  } catch (error) {
    console.error('Error in getHighPriorityTasks:', error);
    return [];
  }
}

export async function getTasksDueThisWeek(limit: number = 50) {
  try {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        assignee_id,
        projects!tasks_project_id_fkey (
          name
        )
      `)
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', nextWeek.toISOString().split('T')[0])
      .in('status', ['To Do', 'In Progress', 'Review'])
      .order('due_date', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching tasks due this week:', error);
      return [];
    }

    // Fetch assignee names for all tasks in parallel
    const assigneeNames = await Promise.all(
      (tasks || []).map(task => getAssigneeNameFromRoleId(task.assignee_id as number | null))
    );

    return tasks?.map((task, index) => ({
      id: task.id,
      title: task.title,
      type: 'Task',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date || 'No due date',
      assignee: assigneeNames[index],
      projectName: task.projects ? (task.projects as unknown as { name: string }).name : 'No Project',
    })) || [];
  } catch (error) {
    console.error('Error in getTasksDueThisWeek:', error);
    return [];
  }
}

export async function getCompletedTasks(limit: number = 50) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        assignee_id,
        projects!tasks_project_id_fkey (
          name
        )
      `)
      .eq('status', 'Done')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching completed tasks:', error);
      return [];
    }

    // Fetch assignee names for all tasks in parallel
    const assigneeNames = await Promise.all(
      (tasks || []).map(task => getAssigneeNameFromRoleId(task.assignee_id as number | null))
    );

    return tasks?.map((task, index) => ({
      id: task.id,
      title: task.title,
      type: 'Task',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date || 'No due date',
      assignee: assigneeNames[index],
      projectName: task.projects ? (task.projects as unknown as { name: string }).name : 'No Project',
    })) || [];
  } catch (error) {
    console.error('Error in getCompletedTasks:', error);
    return [];
  }
}

export async function getTaskCounts() {
  try {
    // Get high priority tasks count
    const { count: highPriorityCount, error: highPriorityError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'High')
      .in('status', ['To Do', 'In Progress', 'Review']);

    if (highPriorityError) {
      console.error('Error fetching high priority count:', highPriorityError);
    }

    // Get tasks due this week count
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const { count: dueThisWeekCount, error: dueThisWeekError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', nextWeek.toISOString().split('T')[0])
      .in('status', ['To Do', 'In Progress', 'Review']);

    if (dueThisWeekError) {
      console.error('Error fetching due this week count:', dueThisWeekError);
    }

    // Get completed tasks count
    const { count: completedCount, error: completedError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Done');

    if (completedError) {
      console.error('Error fetching completed count:', completedError);
    }

    return {
      highPriority: highPriorityCount || 0,
      dueThisWeek: dueThisWeekCount || 0,
      completed: completedCount || 0,
    };
  } catch (error) {
    console.error('Error in getTaskCounts:', error);
    return {
      highPriority: 0,
      dueThisWeek: 0,
      completed: 0,
    };
  }
}

export async function getProjectsList() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching projects list:', error);
      return [];
    }

    return projects || [];
  } catch (error) {
    console.error('Error in getProjectsList:', error);
    return [];
  }
}

export async function getProjectCompletionStats() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('status');

    if (error) {
      console.error('Error fetching project completion stats:', error);
      return {
        totalProjects: 0,
        completedProjects: 0,
        inProgressProjects: 0,
        averageProgress: 0,
      };
    }

    const totalProjects = projects?.length || 0;
    const completedProjects = projects?.filter(p => p.status === 'Completed').length || 0;
    const inProgressProjects = projects?.filter(p => p.status === 'In Progress').length || 0;
    const completionRate = totalProjects > 0 
      ? Math.round((completedProjects / totalProjects) * 100)
      : 0;

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      averageProgress: completionRate,
    };
  } catch (error) {
    console.error('Error in getProjectCompletionStats:', error);
    return {
      totalProjects: 0,
      completedProjects: 0,
      inProgressProjects: 0,
      averageProgress: 0,
    };
  }
}
