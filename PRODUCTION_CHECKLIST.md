# Production Validation Checklist

Before deploying to production, verify all items below are completed and tested.

## Security ✅

- [ ] **JWT_SECRET** is set to a strong random value (min 32 chars)
  ```bash
  openssl rand -base64 32
  ```
- [ ] JWT_SECRET is NOT committed to Git or visible in logs
- [ ] JWT_SECRET is configured in production environment variables
- [ ] `passwordHash` is properly bcrypted in authentication
- [ ] HTTPS/TLS is enabled and configured
- [ ] Security headers are set (see next.config.ts)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin

## Performance ✅

- [ ] Production build completes without errors
  ```bash
  npm run build
  ```
- [ ] Build size is reasonable (< 200MB for .next folder)
- [ ] Source maps disabled in production
- [ ] Gzip/compression enabled
- [ ] Static asset caching configured
- [ ] API response times acceptable (< 500ms)

## Database & Persistence ✅

- [ ] Database backup strategy in place
- [ ] For Vercel: Migration to Supabase planned/completed
- [ ] For Self-hosted: Volume mounting configured for `/data`
- [ ] Upload directory properly mounted/persisted
- [ ] Initial seed data loaded in production
- [ ] Database tested with real production data

## Testing ✅

- [ ] All tests passing (`npm test`)
  ```
  18 unit tests passing
  ```
- [ ] Linting passes (`npm run lint`)
- [ ] No critical warnings in build output
- [ ] Authentication flow tested end-to-end
  - Register new user
  - Login with credentials
  - JWT token generated correctly
  - Token persisted in localStorage
- [ ] Document creation/editing tested
  - Create new document
  - Edit content
  - Autosave working
  - Refresh page - content persists
- [ ] File import tested
  - `.txt` file import
  - `.md` file import
  - `.docx` file import
- [ ] Sharing functionality tested
  - Share with another user (view permission)
  - Share with another user (edit permission)
  - Revoke access
  - Verify shared user can see document
  - Verify shared user has correct permissions

## Deployment ✅

- [ ] Deployment method chosen (Vercel/Docker/Other)
- [ ] Environment variables configured in production
  ```
  JWT_SECRET
  NODE_ENV=production
  NEXT_PUBLIC_API_URL=https://yourdomain.com
  ```
- [ ] Domain/URL configured correctly
- [ ] SSL certificate valid and not expiring soon
- [ ] Deployment scripts tested in staging
- [ ] Rollback procedure documented and tested

## Monitoring & Logging ✅

- [ ] Error logging configured (e.g., Sentry)
- [ ] Application logs accessible
- [ ] Uptime monitoring enabled
- [ ] Performance monitoring enabled
- [ ] Health check endpoint responds (GET /api/auth/me)
- [ ] Alerts configured for critical errors

## Documentation ✅

- [ ] README updated with live URL
- [ ] Deployment documentation complete
- [ ] Runbooks created for common issues
- [ ] Team trained on deployment process
- [ ] Incident response procedure documented

## Final Verification ✅

- [ ] Application loads without errors
- [ ] Dashboard displays correctly
- [ ] Authentication flow works end-to-end
- [ ] Rich text editing works
- [ ] File upload works
- [ ] Sharing/collaboration works
- [ ] Database persistence verified
- [ ] No console errors or warnings
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility tested

---

## Pre-Deployment Checklist (Final 24 hours)

- [ ] Fresh database backup taken
- [ ] Staging environment tested matches production config
- [ ] All team members notified of deployment window
- [ ] Rollback plan reviewed and tested
- [ ] Emergency contact list prepared
- [ ] On-call rotation configured for first 48 hours

---

## Post-Deployment Verification (First 24 hours)

- [ ] Application responding to requests
- [ ] No error spikes in logs
- [ ] Users can login successfully
- [ ] Users can create/edit documents
- [ ] Sharing functionality working
- [ ] File uploads functioning
- [ ] Database persisting correctly
- [ ] Performance metrics within acceptable range

---

## Sign-Off

| Role | Name | Date | Status |
|---|---|---|---|
| Developer | __________ | __________ | ☐ Approved |
| QA | __________ | __________ | ☐ Approved |
| DevOps | __________ | __________ | ☐ Approved |
| Product | __________ | __________ | ☐ Approved |

---

## Issue Log

If issues are discovered during deployment, log them here:

| Issue | Severity | Resolution | Status |
|---|---|---|---|
| | | | |

