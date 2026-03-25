#!/bin/bash
set -e

# Start Supabase if not already running
if ! supabase status 2>/dev/null | grep -q "API URL"; then
  echo "Starting Supabase..."
  supabase start
else
  echo "Supabase already running."
fi

# Start the web app
echo "Starting web app at http://localhost:3000..."
cd apps/web && npm run dev
