#!/bin/bash

# Script to sync .env file variables to Vercel
# Usage: ./sync-env-to-vercel.sh [environment]
# Environment options: production, preview, development (default: all)

ENVIRONMENT=${1:-all}

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Error: Vercel CLI is not installed. Install it with: npm i -g vercel"
    exit 1
fi

# Function to add environment variable to Vercel
add_env_var() {
    local key=$1
    local value=$2
    local env=$3
    
    echo "Adding $key to Vercel ($env)..."
    
    if [ "$env" = "all" ]; then
        # Add to all environments
        echo "$value" | vercel env add "$key" production
        echo "$value" | vercel env add "$key" preview
        echo "$value" | vercel env add "$key" development
    else
        echo "$value" | vercel env add "$key" "$env"
    fi
}

# Read .env file and sync variables
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    if [[ -z "$key" ]] || [[ "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove leading/trailing whitespace from key
    key=$(echo "$key" | xargs)
    
    # Skip if key is empty after trimming
    if [ -z "$key" ]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Add to Vercel
    add_env_var "$key" "$value" "$ENVIRONMENT"
    
done < .env

echo "✅ Environment variables synced to Vercel!"

