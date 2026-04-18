# Quick Deployment Reference

## For Immediate Deployment (Easiest Path)

### Option 1: Vercel (Recommended)
```bash
# 1. Connect your GitHub repo to Vercel
#    → vercel.com → New Project → Import GitHub repo

# 2. Add environment variable in Vercel Dashboard:
#    JWT_SECRET = (generate with: openssl rand -base64 32)

# 3. That's it! Auto-deployed on every GitHub push
```

**Important:** For production data persistence, add Supabase:
- Create Supabase project: supabase.com
- Add DATABASE_URL to Vercel environment
- Update `src/lib/db.ts` to use Supabase

---

### Option 2: Docker (Self-Hosted)
```bash
# 1. Build image
docker build -t ajaia-docs .

# 2. Generate environment
bash scripts/setup-env.sh

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify
curl http://localhost:3000
```

**Server Setup:**
- Ubuntu 22.04 LTS recommended
- Docker + Docker Compose installed
- Domain with SSL (use Let's Encrypt + Nginx)

---

### Option 3: Railway.app (No Server Management)
```bash
# 1. Connect GitHub repo at railway.app
# 2. Railway auto-detects Next.js
# 3. Add JWT_SECRET environment variable
# 4. Deploy
```

---

## Environment Variables Reference

```bash
# Required
JWT_SECRET=your-secure-random-value-32-chars-min

# Optional but recommended
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com

# For database (if migrating from JSON)
DATABASE_URL=postgresql://user:pass@host/db
```

Generate strong secret:
```bash
openssl rand -base64 32
```

---

## Pre-Deployment Checklist (5 min)

- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No lint errors: `npm run lint`
- [ ] JWT_SECRET generated and saved
- [ ] NEXT_PUBLIC_API_URL set to your domain
- [ ] HTTPS certificate ready (auto on Vercel, use Let's Encrypt for self-hosted)

---

## Post-Deployment Testing (10 min)

1. **Registration** → Create new account
2. **Login** → Use created account
3. **Create Document** → Type some content
4. **Refresh Page** → Content persists
5. **Sharing** → Share with test user, verify access
6. **File Upload** → Upload .txt/.md/.docx file

---

## Monitoring

### Vercel
- Dashboard: vercel.com → Project → Deployments
- Logs: Functions tab in project dashboard

### Docker
```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
docker-compose -f docker-compose.prod.yml restart
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Port 3000 in use" | `lsof -i :3000` then `kill -9 <PID>` |
| "Database connection error" | Check JWT_SECRET is set, verify file permissions |
| "HTTPS not working" | For self-hosted, use Let's Encrypt with Nginx |
| "Uploads not persisting" | Ensure `/uploads` directory mounted in Docker |

---

## Key Files

| File | Purpose |
|---|---|
| [.env.example](.env.example) | Environment template |
| [vercel.json](vercel.json) | Vercel configuration |
| [Dockerfile](Dockerfile) | Docker build config |
| [docker-compose.prod.yml](docker-compose.prod.yml) | Docker runtime config |
| [nginx.conf](nginx.conf) | Reverse proxy configuration |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Full deployment guide |
| [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) | Validation checklist |

---

## Support

1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides
2. Review logs (Vercel Dashboard or `docker logs`)
3. Verify environment variables are set
4. Test database connectivity
5. Check firewall/security group rules

