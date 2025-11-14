#!/bin/bash

# Export Google OAuth credentials from environment variables
# These should be set in your .env file or shell environment
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}"

# Start Supabase
supabase start

