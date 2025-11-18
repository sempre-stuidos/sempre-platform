-- ============================================================================
-- Tutorials Table
-- ============================================================================

create table if not exists public.tutorials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('Events', 'Menu')),
  icon text not null,
  estimated_time text not null,
  content jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Create indexes
create index if not exists tutorials_category_idx on public.tutorials(category);
create index if not exists tutorials_created_at_idx on public.tutorials(created_at);

-- Create trigger to automatically update the updated_at column
create trigger update_tutorials_updated_at 
    before update on public.tutorials 
    for each row 
    execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table public.tutorials enable row level security;

-- RLS Policies for tutorials
-- All authenticated users can view tutorials
create policy "Authenticated users can view tutorials" on public.tutorials
    for select using (auth.uid() IS NOT NULL);

-- Only service role can insert/update/delete tutorials (for seeding)
-- In production, you might want to add admin policies here

