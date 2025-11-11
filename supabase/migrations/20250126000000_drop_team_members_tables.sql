-- ============================================================================
-- Drop Team Members Tables
-- Remove team_members, team_member_skills, and team_member_deadlines tables
-- These are replaced by user_roles table which links to auth.users
-- ============================================================================

-- Drop dependent tables first (due to foreign key constraints)
DROP TABLE IF EXISTS team_member_deadlines CASCADE;
DROP TABLE IF EXISTS team_member_skills CASCADE;

-- Drop the main team_members table
DROP TABLE IF EXISTS team_members CASCADE;

-- Note: project_team_members is kept as it's a junction table for projects
-- and will need to be updated separately to reference user_roles or auth.users

