-- ============================================================================
-- Events Table
-- ============================================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  short_description text,
  description text,
  image_url text,
  event_type text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  publish_start_at timestamptz,
  publish_end_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'past', 'archived')),
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Create indexes
create index if not exists events_org_id_idx on public.events(org_id);
create index if not exists events_publish_window_idx on public.events(org_id, publish_start_at, publish_end_at);
create index if not exists events_status_idx on public.events(status);
create index if not exists events_starts_at_idx on public.events(starts_at);

-- Create trigger to automatically update the updated_at column
create trigger update_events_updated_at 
    before update on public.events 
    for each row 
    execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table public.events enable row level security;

-- RLS Policies for events
-- Members can view events in their organizations
create policy "Members can view organization events" on public.events
    for select using (
        exists (
            select 1 from public.memberships m
            where m.org_id = events.org_id
            and m.user_id = auth.uid()
        )
    );

-- Members can insert events in their organizations
create policy "Members can insert organization events" on public.events
    for insert with check (
        exists (
            select 1 from public.memberships m
            where m.org_id = events.org_id
            and m.user_id = auth.uid()
        )
    );

-- Members can update events in their organizations
create policy "Members can update organization events" on public.events
    for update using (
        exists (
            select 1 from public.memberships m
            where m.org_id = events.org_id
            and m.user_id = auth.uid()
        )
    );

-- Members can delete events in their organizations
create policy "Members can delete organization events" on public.events
    for delete using (
        exists (
            select 1 from public.memberships m
            where m.org_id = events.org_id
            and m.user_id = auth.uid()
        )
    );
