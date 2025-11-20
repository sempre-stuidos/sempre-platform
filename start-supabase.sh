#!/bin/bash

# Export Google OAuth credentials from environment variables
# These should be set in your .env.local file or shell environment
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}"

# Export Supabase-specific Google OAuth credentials
# If not set, use the same values as GOOGLE_CLIENT_ID/SECRET
export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="${SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID:-${GOOGLE_CLIENT_ID}}"
export SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET="${SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET:-${GOOGLE_CLIENT_SECRET}}"

# Start Supabase
supabase start

