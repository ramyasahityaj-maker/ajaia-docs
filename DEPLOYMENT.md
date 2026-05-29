# Production Deployment Guide

## Overview

This guide covers deploying Ajaia Docs to production. The application is a Next.js 16 app that uses Supabase PostgreSQL for data persistence in production and JSON files for local development.

---

## Option 1: Vercel (Recommended for Next.js)

**Pros:** Easiest, native Next.js support, free tier available, auto-scaling  
**Cons:** Requires Supabase setup for database persistence

### Steps

1. **Set up Supabase Database**
   - Create a free account at [supabase.com](https://supabase.com)
   - Click "New Project" and fill in your project details
   - Wait for the database to be ready (usually 2-3 minutes)
   - Go to Settings → API to get your project URL and anon key

2. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New → Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js configuration

4. **Set Environment Variables**
   - In Project Settings → Environment Variables, add:
     ```
     JWT_SECRET=<generate-a-strong-random-string>
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```

5. **Initialize Database Tables**
   - After deployment, run the database setup:
     ```bash
     npm run setup-db
     ```
   - Or manually create the tables in Supabase SQL Editor with:
     ```sql
     CREATE TABLE users (
       id TEXT PRIMARY KEY,
       email TEXT UNIQUE NOT NULL,
       name TEXT NOT NULL,
       password_hash TEXT NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
     );

     CREATE TABLE documents (
       id TEXT PRIMARY KEY,
       title TEXT NOT NULL,
       content TEXT NOT NULL,
       owner_id TEXT NOT NULL REFERENCES users(id),
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
     );

     CREATE TABLE shares (
       id TEXT PRIMARY KEY,
       document_id TEXT NOT NULL REFERENCES documents(id),
       user_id TEXT NOT NULL REFERENCES users(id),
       permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE(document_id, user_id)
     );
     ```

6. **Deploy**
   - Push changes to GitHub - Vercel will auto-deploy

---

## Option 2: Docker + Self-Hosted (AWS EC2, DigitalOcean, etc.)

**Pros:** Full control, can persist data easily, cheaper for low traffic  
**Cons:** Requires server management

### Prerequisites

- Docker and Docker Compose installed
- Server running Linux (Ubuntu 22.04 recommended)
- Domain name pointing to server
- Port 3000 accessible (or behind reverse proxy)

### Steps

1. **Build Docker Image**
   ```bash
   docker build -t ajaia-docs:latest .
   ```

2. **Using Docker Compose**
   ```bash
   # Create .env file with production secrets
   cp .env.example .env
   # Edit .env and set real values
   nano .env
   
   # Start the application
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Set Up Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Enable HTTPS with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot certonly --nginx -d yourdomain.com
   ```

5. **Data Backup**
   ```bash
   # Backup database daily
   0 2 * * * tar -czf /backups/ajaia-db-$(date +\%Y\%m\%d).tar.gz /app/data/
   
   # Backup uploads
   0 3 * * * tar -czf /backups/ajaia-uploads-$(date +\%Y\%m\%d).tar.gz /app/uploads/
   ```

---

## Option 3: Railway.app

**Pros:** Simple Git-based deployment, good for databases, free tier  
**Cons:** Less customizable than full VPS

### Steps

1. **Connect Repository**
   - Visit [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub"
   - Select your repository

2. **Add Environment Variables**
   - In Railway dashboard, add variables:
     ```
     JWT_SECRET=<secure-value>
     NODE_ENV=production
     ```

3. **Deploy**
   - Railway auto-deploys on Git push

---

## Option 4: Self-Hosted with Database Migration

For production-grade reliability, migrate from JSON to PostgreSQL:

### Migration Steps

1. **Create Supabase Project**
   ```
   - Visit supabase.com
   - Create new project
   - Note the DATABASE_URL
   ```

2. **Update `.env.production`**
   ```
   JWT_SECRET=<secure-value>
   DATABASE_URL=postgresql://...
   ```

3. **Update `src/lib/db.ts`**
   - Replace JSON file operations with Supabase client
   - Keep the same interface for zero app changes

4. **Run Migrations**
   ```bash
   npm run migrate:prod
   ```

---

## Production Checklist

- [ ] Set strong `JWT_SECRET` (use `openssl rand -base64 32`)
- [ ] Configure `NEXT_PUBLIC_API_URL` to your production domain
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set `NODE_ENV=production`
- [ ] Disable source maps (`productionBrowserSourceMaps: false`)
- [ ] Configure database backup strategy
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure rate limiting for API endpoints
- [ ] Test file uploads work correctly
- [ ] Verify authentication tokens work
- [ ] Test sharing functionality end-to-end
- [ ] Set up monitoring/uptime alerts
- [ ] Document deployment & rollback procedures

---

## Monitoring & Logs

### Vercel
- Logs available in Vercel dashboard under "Functions" → "Logs"

### Docker
```bash
# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker logs <container-id>
```

---

## Rollback Procedure

### Vercel
- Automatic rollback to previous build: Project Settings → Deployments → Select previous version

### Docker
```bash
# Rollback to previous image version
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## Performance Tips

1. **Enable Caching**
   ```bash
   # Set cache headers in next.config.ts (already configured)
   ```

2. **Use CDN for Static Assets**
   - Vercel includes global CDN
   - For self-hosted, use Cloudflare Free tier

3. **Database Optimization**
   - Add indexes on frequently queried fields
   - Archive old documents periodically

4. **Monitor & Alert**
   ```bash
   # CPU/Memory usage
   docker stats
   
   # Disk space
   df -h
   ```

---

## Troubleshooting

### "Port 3000 already in use"
```bash
lsof -i :3000
kill -9 <PID>
```

### "Database connection failed"
- Verify `JWT_SECRET` is set
- Check database permissions
- Review error logs

### "Uploads not persisting"
- Ensure `/app/uploads` volume is mounted in Docker
- Check file permissions on host
- Verify disk space available

---

## Support

For issues:
1. Check logs: `docker logs <container-id>`
2. Verify environment variables are set
3. Test database connectivity
4. Check firewall/security group rules

