#!/bin/sh
set -e

# Always check and install dependencies if needed
# This ensures dependencies are installed even when volume is mounted
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.pnpm-lock.yaml" ] || [ "pnpm-lock.yaml" -nt "node_modules/.pnpm-lock.yaml" ]; then
  echo "Installing dependencies..."
  pnpm install --frozen-lockfile
fi

# Execute the command passed to the entrypoint
exec "$@"

