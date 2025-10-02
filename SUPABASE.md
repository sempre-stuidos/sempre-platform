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
