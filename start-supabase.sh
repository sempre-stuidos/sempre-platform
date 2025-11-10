#!/bin/bash

# Export Google OAuth credentials
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}"

# Start Supabase
supabase start

