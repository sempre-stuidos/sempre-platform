-- ============================================================================
-- Bands Tables
-- Creates tables for managing bands and linking them to events
-- ============================================================================

-- Bands table
create table if not exists public.bands (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Event bands junction table
create table if not exists public.event_bands (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  band_id uuid not null references public.bands(id) on delete cascade,
  "order" integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique(event_id, band_id)
);

-- Create indexes
create index if not exists bands_org_id_idx on public.bands(org_id);
create index if not exists event_bands_event_id_idx on public.event_bands(event_id);
create index if not exists event_bands_band_id_idx on public.event_bands(band_id);
create index if not exists event_bands_order_idx on public.event_bands(event_id, "order");

-- Create trigger to automatically update the updated_at column
create trigger update_bands_updated_at 
    before update on public.bands 
    for each row 
    execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table public.bands enable row level security;
alter table public.event_bands enable row level security;

-- RLS Policies for bands
drop policy if exists "Members can view organization bands" on public.bands;
drop policy if exists "Members can insert organization bands" on public.bands;
drop policy if exists "Members can update organization bands" on public.bands;
drop policy if exists "Members can delete organization bands" on public.bands;

create policy "Members can view organization bands" on public.bands
    for select using (
        exists (
            select 1 from public.memberships m
            where m.org_id = bands.org_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can insert organization bands" on public.bands
    for insert with check (
        exists (
            select 1 from public.memberships m
            where m.org_id = bands.org_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can update organization bands" on public.bands
    for update using (
        exists (
            select 1 from public.memberships m
            where m.org_id = bands.org_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can delete organization bands" on public.bands
    for delete using (
        exists (
            select 1 from public.memberships m
            where m.org_id = bands.org_id
            and m.user_id = auth.uid()
        )
    );

-- RLS Policies for event_bands
drop policy if exists "Members can view event bands" on public.event_bands;
drop policy if exists "Members can insert event bands" on public.event_bands;
drop policy if exists "Members can update event bands" on public.event_bands;
drop policy if exists "Members can delete event bands" on public.event_bands;

create policy "Members can view event bands" on public.event_bands
    for select using (
        exists (
            select 1 from public.events e
            join public.memberships m on m.org_id = e.org_id
            where e.id = event_bands.event_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can insert event bands" on public.event_bands
    for insert with check (
        exists (
            select 1 from public.events e
            join public.memberships m on m.org_id = e.org_id
            where e.id = event_bands.event_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can update event bands" on public.event_bands
    for update using (
        exists (
            select 1 from public.events e
            join public.memberships m on m.org_id = e.org_id
            where e.id = event_bands.event_id
            and m.user_id = auth.uid()
        )
    );

create policy "Members can delete event bands" on public.event_bands
    for delete using (
        exists (
            select 1 from public.events e
            join public.memberships m on m.org_id = e.org_id
            where e.id = event_bands.event_id
            and m.user_id = auth.uid()
        )
    );
