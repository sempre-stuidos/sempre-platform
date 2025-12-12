-- ============================================================================
-- Event Instances Tables
-- Creates tables for managing individual occurrences of weekly events
-- ============================================================================

-- Event instances table
create table if not exists public.event_instances (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  instance_date date not null,
  custom_description text,
  custom_image_url text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'past', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(event_id, instance_date)
);

-- Event instance bands junction table
create table if not exists public.event_instance_bands (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.event_instances(id) on delete cascade,
  band_id uuid not null references public.bands(id) on delete cascade,
  "order" integer not null default 0,
  unique(instance_id, band_id)
);

-- Create indexes
create index if not exists event_instances_event_id_idx on public.event_instances(event_id);
create index if not exists event_instances_instance_date_idx on public.event_instances(instance_date);
create index if not exists event_instances_status_idx on public.event_instances(status);
create index if not exists event_instance_bands_instance_id_idx on public.event_instance_bands(instance_id);
create index if not exists event_instance_bands_band_id_idx on public.event_instance_bands(band_id);
create index if not exists event_instance_bands_order_idx on public.event_instance_bands(instance_id, "order");

-- Create trigger to automatically update the updated_at column
create trigger update_event_instances_updated_at 
    before update on public.event_instances 
    for each row 
    execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table public.event_instances enable row level security;
alter table public.event_instance_bands enable row level security;

-- RLS Policies for event_instances
drop policy if exists "Members can view event instances" on public.event_instances;
drop policy if exists "Members can insert event instances" on public.event_instances;
drop policy if exists "Members can update event instances" on public.event_instances;
drop policy if exists "Members can delete event instances" on public.event_instances;

create policy "Members can view event instances" on public.event_instances
    for select using (
        exists (
            select 1 from public.events e
            join public.memberships m on m.org_id = e.org_id
            where e.id = event_instances.event_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can insert event instances" on public.event_instances
    for insert with check (
        exists (
            select 1 from public.events e
            join public.memberships m on m.org_id = e.org_id
            where e.id = event_instances.event_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can update event instances" on public.event_instances
    for update using (
        exists (
            select 1 from public.events e
            join public.memberships m on m.org_id = e.org_id
            where e.id = event_instances.event_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can delete event instances" on public.event_instances
    for delete using (
        exists (
            select 1 from public.events e
            join public.memberships m on m.org_id = e.org_id
            where e.id = event_instances.event_id
            and m.user_id = auth.uid()
        )
    );

-- RLS Policies for event_instance_bands
drop policy if exists "Members can view event instance bands" on public.event_instance_bands;
drop policy if exists "Members can insert event instance bands" on public.event_instance_bands;
drop policy if exists "Members can update event instance bands" on public.event_instance_bands;
drop policy if exists "Members can delete event instance bands" on public.event_instance_bands;

create policy "Members can view event instance bands" on public.event_instance_bands
    for select using (
        exists (
            select 1 from public.event_instances ei
            join public.events e on e.id = ei.event_id
            join public.memberships m on m.org_id = e.org_id
            where ei.id = event_instance_bands.instance_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can insert event instance bands" on public.event_instance_bands
    for insert with check (
        exists (
            select 1 from public.event_instances ei
            join public.events e on e.id = ei.event_id
            join public.memberships m on m.org_id = e.org_id
            where ei.id = event_instance_bands.instance_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can update event instance bands" on public.event_instance_bands
    for update using (
        exists (
            select 1 from public.event_instances ei
            join public.events e on e.id = ei.event_id
            join public.memberships m on m.org_id = e.org_id
            where ei.id = event_instance_bands.instance_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can delete event instance bands" on public.event_instance_bands
    for delete using (
        exists (
            select 1 from public.event_instances ei
            join public.events e on e.id = ei.event_id
            join public.memberships m on m.org_id = e.org_id
            where ei.id = event_instance_bands.instance_id
            and m.user_id = auth.uid()
        )
    );
