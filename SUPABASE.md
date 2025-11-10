# Supabase Setup

This project now includes local Supabase development environment.

## Services Running

- **API URL**: http://127.0.0.1:54321
- **Studio URL**: http://127.0.0.1:54323 (Database management interface)
- **Database URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **GraphQL URL**: http://127.0.0.1:54321/graphql/v1
- **Storage URL**: http://127.0.0.1:54321/storage/v1/s3

## Environment Variables

The following environment variables are configured in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## Usage

### Client-side (React components)
```typescript
import { supabase } from '@/lib/supabase'

// Example: Fetch data
const { data, error } = await supabase
  .from('your_table')
  .select('*')
```

### Server-side (API routes, server components)
```typescript
import { supabaseAdmin } from '@/lib/supabase'

// Example: Admin operations
const { data, error } = await supabaseAdmin
  .from('your_table')
  .select('*')
```

## Commands

- **Start Supabase**: `npx supabase start`
- **Stop Supabase**: `npx supabase stop`
- **Status**: `npx supabase status`
- **Reset Database**: `npx supabase db reset`

## Database Management

Access the Supabase Studio at http://127.0.0.1:54323 to:
- View and edit tables
- Run SQL queries
- Manage authentication
- Configure storage buckets
- Set up real-time subscriptions

## Next Steps

1. Create your database schema in the Studio
2. Set up authentication if needed
3. Configure Row Level Security (RLS) policies
4. Add your tables and relationships
5. Start building your application features

## Agent Chat Configuration

The AI Coach page relies on signed-in users and never uses anonymous credentials.

1. In Supabase Studio, open **Authentication → Settings** and make sure `Enable anonymous sign-ins` stays **disabled**. The new `conversations`, `messages`, and `conversation_states` tables enforce RLS policies that require a valid `auth.uid()`.
2. Review **Authentication → Providers** to confirm at least one provider (email, Google, etc.) is enabled so users can authenticate before visiting `/agent`.
3. Verify the `auth.users` row for your test user exists; only authenticated users can insert or read chat history.

Set the AI environment variables in `.env.local` (values already default to the demo keys, but you should supply your own in production):

```
AI_BASE_URL=https://api.aimlapi.com/v1
AI_API_KEY=your_aiml_api_key
AI_DEFAULT_MODEL=gpt-4o
```

After updating environment variables, restart the Next.js dev server so `/app/api/chat/route.ts` picks up the new values.
