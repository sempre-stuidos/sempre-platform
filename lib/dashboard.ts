import { supabase } from './supabase';
import { DashboardStats, DashboardChartData } from './types';

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

    // Get active projects count and average progress
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, progress')
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

    // Calculate average project progress
    const activeProjects = projectsData || [];
    const averageProgress = activeProjects.length > 0 
      ? Math.round(activeProjects.reduce((sum, project) => sum + (project.progress || 0), 0) / activeProjects.length)
      : 0;

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

    return {
      activeClients: clientsData?.length || 0,
      activeProjects: activeProjects.length,
      tasksThisWeek: tasksData?.length || 0,
      recentNotes: notesData?.length || 0,
      projectProgress: averageProgress,
      clientGrowth: clientGrowth,
      notesToday: todayNotesData?.length || 0,
    };
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return {
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
    // Get project activity data for the last 90 days
    const today = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);

    // Get projects created over time
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('created_at')
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (projectsError) {
      console.error('Error fetching projects for chart:', projectsError);
      return generateFallbackChartData();
    }

    // Get tasks created over time
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('created_at')
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (tasksError) {
      console.error('Error fetching tasks for chart:', tasksError);
    }

    // Create chart data by aggregating projects and tasks by date
    const chartData: DashboardChartData[] = [];
    const dateMap = new Map<string, { desktop: number; mobile: number }>();

    // Initialize all dates in the range
    for (let i = 0; i < 90; i++) {
      const date = new Date(ninetyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { desktop: 0, mobile: 0 });
    }

    // Count projects by date (desktop)
    projectsData?.forEach(project => {
      const dateStr = project.created_at.split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) {
        existing.desktop += 1;
      }
    });

    // Count tasks by date (mobile)
    tasksData?.forEach(task => {
      const dateStr = task.created_at.split('T')[0];
      const existing = dateMap.get(dateStr);
      if (existing) {
        existing.mobile += 1;
      }
    });

    // Convert to array format
    dateMap.forEach((value, date) => {
      chartData.push({
        date,
        desktop: value.desktop,
        mobile: value.mobile,
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
      date: date.toISOString().split('T')[0],
      desktop: Math.floor(Math.random() * 5), // Random project activity
      mobile: Math.floor(Math.random() * 8),   // Random task activity
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
        assignee_name,
        project_name
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent tasks:', error);
      return [];
    }

    return tasks?.map(task => ({
      id: task.id,
      title: task.title,
      type: 'Task', // Default type
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      assignee: task.assignee_name,
    })) || [];
  } catch (error) {
    console.error('Error in getRecentTasks:', error);
    return [];
  }
}

export async function getProjectCompletionStats() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('status, progress');

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
    const averageProgress = totalProjects > 0 
      ? Math.round(projects.reduce((sum, project) => sum + (project.progress || 0), 0) / totalProjects)
      : 0;

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      averageProgress,
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
