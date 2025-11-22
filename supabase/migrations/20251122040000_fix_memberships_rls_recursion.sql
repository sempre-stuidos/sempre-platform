-- ============================================================================
-- Fix Memberships RLS Infinite Recursion
-- The "Members can view organization memberships" policy causes infinite
-- recursion because it queries the memberships table, which triggers RLS
-- on memberships again, creating a loop.
-- 
-- Solution: Remove the recursive policy and use a security definer function
-- or rely on the simpler "Users can view their own memberships" policy
-- ============================================================================

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Members can view organization memberships" ON memberships;

-- Create a security definer function to check membership without RLS
CREATE OR REPLACE FUNCTION check_user_membership(
    p_org_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS(
        SELECT 1 FROM memberships
        WHERE org_id = p_org_id
        AND user_id = p_user_id
    );
$$;

-- Comment
COMMENT ON FUNCTION check_user_membership IS 'Checks if a user is a member of an organization. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';

-- Recreate the policy using the security definer function
-- This avoids recursion because the function bypasses RLS
CREATE POLICY "Members can view organization memberships" ON memberships
    FOR SELECT USING (
        check_user_membership(org_id, auth.uid())
    );

-- Create additional security definer functions for role checks
CREATE OR REPLACE FUNCTION check_user_role_in_org(
    p_org_id UUID,
    p_user_id UUID,
    p_roles TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS(
        SELECT 1 FROM memberships
        WHERE org_id = p_org_id
        AND user_id = p_user_id
        AND role = ANY(p_roles)
    );
$$;

COMMENT ON FUNCTION check_user_role_in_org IS 'Checks if a user has one of the specified roles in an organization. Uses SECURITY DEFINER to bypass RLS.';

-- Also update the UPDATE and DELETE policies to use the function to avoid recursion
DROP POLICY IF EXISTS "Owners and admins can update memberships" ON memberships;
CREATE POLICY "Owners and admins can update memberships" ON memberships
    FOR UPDATE USING (
        check_user_role_in_org(org_id, auth.uid(), ARRAY['owner', 'admin'])
    );

DROP POLICY IF EXISTS "Owners can remove members" ON memberships;
CREATE POLICY "Owners can remove members" ON memberships
    FOR DELETE USING (
        check_user_role_in_org(org_id, auth.uid(), ARRAY['owner'])
    );

-- Fix the INSERT policy too
DROP POLICY IF EXISTS "Owners and admins can add members" ON memberships;
CREATE POLICY "Owners and admins can add members" ON memberships
    FOR INSERT WITH CHECK (
        check_user_role_in_org(org_id, auth.uid(), ARRAY['owner', 'admin'])
    );

-- Note: The INSERT policy "Owners and admins can add members" also needs fixing
-- but it's currently empty, so we'll leave it for now

