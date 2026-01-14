#!/bin/bash
# Deployment script for CAI-search
# This script runs on the droplet and pulls the latest code without wiping the database

set -e

echo "🚀 Starting deployment..."

# Make sure we're in the right directory
cd /var/www/cai-search

# Pull latest code from GitHub (excluding data directory)
echo "📥 Pulling latest code from GitHub..."
git fetch origin main
git checkout origin/main -- . --force

# Exclude these from the checkout so they're not overwritten
git checkout HEAD -- data/ || true
git checkout HEAD -- server/data/ || true

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Install client dependencies
cd client
npm install --production
cd ..

# Ensure database exists and schema is initialized
echo "🗄️  Ensuring database is initialized..."
if [ ! -f server/data/cai_decisions.db ]; then
  echo "Database not found. Initializing..."
  npm run db:migrate
else
  echo "Database already exists. Skipping initialization."
fi

# Dependencies are already built by GitHub Actions, so we skip the build step here
# The built client will be copied directly by the workflow

echo "✅ Deployment complete!"
echo "Database has been preserved and is ready to use."
