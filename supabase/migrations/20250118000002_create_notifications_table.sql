-- ============================================================================
-- Notifications Table
-- Creates table for managing user notifications
-- ============================================================================

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  related_event_id uuid references public.events(id) on delete set null,
  related_instance_id uuid references public.event_instances(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

-- Create indexes
create index if not exists notifications_org_id_idx on public.notifications(org_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_read_at_idx on public.notifications(user_id, read_at);
create index if not exists notifications_type_idx on public.notifications(type);
create index if not exists notifications_related_event_id_idx on public.notifications(related_event_id);
create index if not exists notifications_related_instance_id_idx on public.notifications(related_instance_id);

-- Enable Row Level Security (RLS)
alter table public.notifications enable row level security;

-- RLS Policies for notifications
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;

create policy "Users can view their own notifications" on public.notifications
    for select using (
        user_id = auth.uid()
        and exists (
            select 1 from public.memberships m
            where m.org_id = notifications.org_id
            and m.user_id = auth.uid()
        )
    );

create policy "Users can update their own notifications" on public.notifications
    for update using (
        user_id = auth.uid()
        and exists (
            select 1 from public.memberships m
            where m.org_id = notifications.org_id
            and m.user_id = auth.uid()
        )
    );

-- Note: Notifications are created by the system, not by users directly
-- So we don't need an INSERT policy for regular users
