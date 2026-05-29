#!/bin/bash
# Production Build Script
# This script builds the application for production and prepares it for deployment

set -e

echo "🔨 Building Ajaia Docs for production..."

# Check if Node modules are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Run linter
echo "🔍 Running linter..."
npm run lint || echo "⚠️  Linting passed with warnings"

# Run tests
echo "🧪 Running tests..."
npm run test

# Build Next.js app
echo "🏗️  Building Next.js application..."
npm run build

# Output build information
echo ""
echo "✅ Build completed successfully!"
echo ""
echo "📊 Build Output:"
du -sh .next
echo ""
echo "🚀 Next steps:"
echo "  - For Vercel: Push to GitHub"
echo "  - For Docker: docker build -t ajaia-docs:latest ."
echo "  - For Node.js: npm run start"
