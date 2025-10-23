import { supabase } from './supabase';
import { TeamMember } from './types';

// Transform database record to match frontend interface
function transformTeamMemberRecord(record: Record<string, unknown>, skills: Record<string, unknown>[], deadlines: Record<string, unknown>[]): TeamMember {
  return {
    id: record.id as number,
    name: record.name as string,
    role: record.role as string,
    status: record.status as "Active" | "Contractor" | "Past Collaborator",
    email: record.email as string,
    timezone: record.timezone as string,
    avatar: record.avatar as string,
    currentProjects: record.current_projects as number,
    activeTasks: record.active_tasks as number,
    workload: record.workload as number,
    skills: skills.map(s => s.skill as string),
    upcomingDeadlines: deadlines.map(d => ({
      project: d.project as string,
      deadline: d.deadline as string,
      type: d.type as string
    })),
    created_at: record.created_at as string,
    updated_at: record.updated_at as string,
  };
}

// Transform frontend interface to database record format
function transformTeamMemberToRecord(teamMember: Partial<TeamMember>) {
  return {
    name: teamMember.name,
    role: teamMember.role,
    status: teamMember.status,
    email: teamMember.email,
    timezone: teamMember.timezone,
    avatar: teamMember.avatar,
    current_projects: teamMember.currentProjects,
    active_tasks: teamMember.activeTasks,
    workload: teamMember.workload,
  };
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  try {
    // Fetch team members
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('team_members')
      .select('*')
      .order('id', { ascending: true });

    if (teamMembersError) {
      console.error('Error fetching team members:', teamMembersError);
      throw teamMembersError;
    }

    if (!teamMembers || teamMembers.length === 0) {
      return [];
    }

    // Fetch all related data in parallel
    const teamMemberIds = teamMembers.map(tm => tm.id);
    
    const [
      { data: skills },
      { data: deadlines }
    ] = await Promise.all([
      supabase.from('team_member_skills').select('*').in('team_member_id', teamMemberIds),
      supabase.from('team_member_deadlines').select('*').in('team_member_id', teamMemberIds)
    ]);

    // Group related data by team_member_id
    const skillsByTeamMember = (skills || []).reduce((acc: Record<string, Record<string, unknown>[]>, skill: Record<string, unknown>) => {
      const teamMemberId = skill.team_member_id as string;
      if (!acc[teamMemberId]) acc[teamMemberId] = [];
      acc[teamMemberId].push(skill);
      return acc;
    }, {});

    const deadlinesByTeamMember = (deadlines || []).reduce((acc: Record<string, Record<string, unknown>[]>, deadline: Record<string, unknown>) => {
      const teamMemberId = deadline.team_member_id as string;
      if (!acc[teamMemberId]) acc[teamMemberId] = [];
      acc[teamMemberId].push(deadline);
      return acc;
    }, {});

    return teamMembers.map(teamMember => 
      transformTeamMemberRecord(
        teamMember,
        skillsByTeamMember[teamMember.id] || [],
        deadlinesByTeamMember[teamMember.id] || []
      )
    );
  } catch (error) {
    console.error('Error in getAllTeamMembers:', error);
    return [];
  }
}

export async function getTeamMemberById(id: number): Promise<TeamMember | null> {
  try {
    // Fetch team member
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single();

    if (teamMemberError) {
      console.error('Error fetching team member:', teamMemberError);
      throw teamMemberError;
    }

    if (!teamMember) {
      return null;
    }

    // Fetch all related data in parallel
    const [
      { data: skills },
      { data: deadlines }
    ] = await Promise.all([
      supabase.from('team_member_skills').select('*').eq('team_member_id', id),
      supabase.from('team_member_deadlines').select('*').eq('team_member_id', id)
    ]);

    return transformTeamMemberRecord(
      teamMember,
      skills || [],
      deadlines || []
    );
  } catch (error) {
    console.error('Error in getTeamMemberById:', error);
    return null;
  }
}

export async function createTeamMember(teamMember: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMember | null> {
  try {
    // Insert team member
    const { data: newTeamMember, error: teamMemberError } = await supabase
      .from('team_members')
      .insert([transformTeamMemberToRecord(teamMember)])
      .select()
      .single();

    if (teamMemberError) {
      console.error('Error creating team member:', teamMemberError);
      throw teamMemberError;
    }

    if (!newTeamMember) {
      return null;
    }

    const teamMemberId = newTeamMember.id;

    // Insert related data in parallel
    const insertPromises = [];

    if (teamMember.skills && teamMember.skills.length > 0) {
      const skillsData = teamMember.skills.map(skill => ({
        team_member_id: teamMemberId,
        skill
      }));
      insertPromises.push(
        supabase.from('team_member_skills').insert(skillsData)
      );
    }

    if (teamMember.upcomingDeadlines && teamMember.upcomingDeadlines.length > 0) {
      const deadlinesData = teamMember.upcomingDeadlines.map(deadline => ({
        team_member_id: teamMemberId,
        project: deadline.project,
        deadline: deadline.deadline,
        type: deadline.type
      }));
      insertPromises.push(
        supabase.from('team_member_deadlines').insert(deadlinesData)
      );
    }

    await Promise.all(insertPromises);

    // Return the complete team member with all related data
    return await getTeamMemberById(teamMemberId);
  } catch (error) {
    console.error('Error in createTeamMember:', error);
    return null;
  }
}

export async function updateTeamMember(id: number, updates: Partial<TeamMember>): Promise<TeamMember | null> {
  try {
    // Update team member
    const { error: teamMemberError } = await supabase
      .from('team_members')
      .update(transformTeamMemberToRecord(updates))
      .eq('id', id)
      .select()
      .single();

    if (teamMemberError) {
      console.error('Error updating team member:', teamMemberError);
      throw teamMemberError;
    }

    // Return the complete team member with all related data
    return await getTeamMemberById(id);
  } catch (error) {
    console.error('Error in updateTeamMember:', error);
    return null;
  }
}

export async function deleteTeamMember(id: number): Promise<boolean> {
  try {
    // Delete team member (cascading deletes will handle related data)
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTeamMember:', error);
    return false;
  }
}

export async function getTeamMembersByStatus(status: 'Active' | 'Contractor' | 'Past Collaborator'): Promise<TeamMember[]> {
  try {
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('status', status)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching team members by status:', error);
      throw error;
    }

    if (!teamMembers || teamMembers.length === 0) {
      return [];
    }

    // For filtered results, we can return simplified data without all relations
    // or fetch full data if needed
    return teamMembers.map(teamMember => 
      transformTeamMemberRecord(teamMember, [], [])
    );
  } catch (error) {
    console.error('Error in getTeamMembersByStatus:', error);
    return [];
  }
}

export async function getTeamMembersByRole(role: string): Promise<TeamMember[]> {
  try {
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('role', role)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching team members by role:', error);
      throw error;
    }

    if (!teamMembers || teamMembers.length === 0) {
      return [];
    }

    return teamMembers.map(teamMember => 
      transformTeamMemberRecord(teamMember, [], [])
    );
  } catch (error) {
    console.error('Error in getTeamMembersByRole:', error);
    return [];
  }
}
