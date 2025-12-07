-- ============================================================================
-- Add Weekly Events Support
-- ============================================================================

-- Add is_weekly column (default false for existing events)
alter table public.events 
  add column if not exists is_weekly boolean not null default false;

-- Add day_of_week column (0-6, where 0=Sunday, 6=Saturday)
alter table public.events 
  add column if not exists day_of_week integer check (day_of_week >= 0 and day_of_week <= 6);

-- Make starts_at and ends_at nullable (for weekly events, we only need time)
-- First, we need to handle existing NOT NULL constraint
-- Drop the constraint if it exists, then alter the columns
do $$
begin
  -- Drop existing NOT NULL constraints if they exist
  alter table public.events alter column starts_at drop not null;
  alter table public.events alter column ends_at drop not null;
exception
  when others then
    -- Columns might already be nullable, ignore error
    null;
end $$;

-- Drop existing constraint if it exists (to avoid conflicts)
alter table public.events 
  drop constraint if exists events_weekly_validation;

-- Add check constraint to ensure data integrity
-- If is_weekly is true, day_of_week must be set
-- If is_weekly is false, starts_at and ends_at must be set
alter table public.events 
  add constraint events_weekly_validation check (
    (is_weekly = true and day_of_week is not null) or
    (is_weekly = false and starts_at is not null and ends_at is not null)
  );

-- Create index for filtering weekly events
create index if not exists events_is_weekly_idx on public.events(org_id, is_weekly);

