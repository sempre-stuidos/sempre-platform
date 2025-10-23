# Apply Database Migrations

## Issue
You're getting a 400 error from Supabase because the database schema hasn't been updated yet.

## Solution
You need to apply the new migrations that were created:

### Migrations to Apply:
1. `supabase/migrations/20251023000000_add_content_to_notes_knowledge.sql` - Adds `content` column
2. `supabase/migrations/20251023000001_add_proposal_type_to_notes_knowledge.sql` - Adds "Proposal" type

### How to Apply Migrations:

#### Option 1: Using Supabase CLI (Recommended)
```bash
# Make sure you're in the project directory
cd /Users/humancontact/Downloads/demos/nextjs/agency-light

# Apply all pending migrations
supabase db push
```

#### Option 2: Manual SQL Execution
If you're using Supabase Studio or the SQL editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Add content field to notes_knowledge table
ALTER TABLE notes_knowledge ADD COLUMN IF NOT EXISTS content TEXT;

-- Add 'Proposal' type to notes_knowledge table type constraint
ALTER TABLE notes_knowledge DROP CONSTRAINT IF EXISTS notes_knowledge_type_check;
ALTER TABLE notes_knowledge ADD CONSTRAINT notes_knowledge_type_check 
  CHECK (type IN ('Proposal', 'Meeting Notes', 'Internal Playbook', 'Research Notes', 'Bug Report', 'Feature Request', 'Standup Notes', 'Documentation'));
```

#### Option 3: Reset Database (Development Only)
```bash
# WARNING: This will delete all data!
supabase db reset
```

## After Applying Migrations
1. Refresh your browser
2. Try creating a note again
3. The errors should be resolved

## Fixed Issues
✅ Duplicate key warning (projects with same name) - now using unique IDs as keys
✅ Better error logging - will show detailed Supabase errors in console
❓ Database schema - needs migrations to be applied

## Check Migration Status
```bash
supabase migration list
```

This will show which migrations have been applied and which are pending.

