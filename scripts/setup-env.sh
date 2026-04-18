#!/bin/bash
# Production Environment Setup Script

# This script helps set up production environment variables securely

set -e

echo "🔐 Production Environment Setup"
echo "=============================="
echo ""

# Generate JWT_SECRET if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "✓ Generated JWT_SECRET"
fi

# Create .env.production
cat > .env.production << EOF
# Production Environment Variables
# Generated on $(date)

# Authentication
JWT_SECRET=$JWT_SECRET

# Environment
NODE_ENV=production

# Server
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-https://ajaia-docs.vercel.app}

# Database (uncomment for production database)
# DATABASE_URL=your-database-url-here

EOF

echo "✅ Created .env.production"
echo ""
echo "⚠️  Important security notes:"
echo "  1. Keep JWT_SECRET secret - never commit to Git"
echo "  2. Update NEXT_PUBLIC_API_URL to your domain"
echo "  3. For production, migrate to PostgreSQL (see DEPLOYMENT.md)"
echo "  4. Use .gitignore to prevent .env.production commits"
echo ""
echo "Files created:"
ls -la .env.production
