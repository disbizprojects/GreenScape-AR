# Vercel Deployment Guide

This guide covers deploying GreenScape AR to Vercel with all necessary configurations.

## Prerequisites

- [ ] GitHub/GitLab account with repo connected to Vercel
- [ ] All required services configured (MongoDB Atlas, Stripe, Cloudinary, Plant.id)
- [ ] Vercel account at https://vercel.com
- [ ] All environment variables ready (see `.env.example`)

## Step 1: Connect Repository to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select "Import Git Repository"
3. Connect your GitHub/GitLab repo
4. Select `greenscape-ar` project
5. Click "Import"

## Step 2: Configure Environment Variables

In Vercel Dashboard, go to **Project Settings → Environment Variables**.

Add ALL variables from `.env.example`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greenscape-ar?retryWrites=true&w=majority
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=<generated-secure-secret>
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_EMAIL=admin@your-domain.com
SEED_SECRET=<generated-secure-secret>
ADMIN_REGISTER_SECRET=<generated-secure-secret>
```

### Generating Secure Secrets

Run locally:
```bash
openssl rand -base64 32  # For NEXTAUTH_SECRET
```

## Step 3: Production Ready Checklist

Before deployment, ensure:

- [ ] **No hardcoded URLs** - All API calls use relative paths (`/api/...`)
- [ ] **Secrets not in code** - All sensitive values in `.env.example` have placeholders
- [ ] **Build succeeds** - Run `npm run build` locally to verify
- [ ] **TypeScript errors resolved** - Run `npx tsc --noEmit` to check
- [ ] **Environment variables set** - All from `.env.example` are in Vercel
- [ ] **Database accessible** - MongoDB URI is correct and Vercel IP whitelisted
- [ ] **Stripe webhooks configured** - Set webhook endpoint to `https://your-domain.com/api/webhooks/stripe`

## Step 4: Deploy

### Initial Deployment

1. In Vercel Dashboard, click **"Deploy"** (automatic on git push if configured)
2. Wait for build to complete
3. Check deployment for errors in Vercel Logs

### Post-Deployment Verification

After deployment succeeds:

```bash
# 1. Verify app is accessible
curl https://your-vercel-domain.vercel.app

# 2. Seed the database (ONLY ONCE)
curl -X POST https://your-vercel-domain.vercel.app/api/seed \
  -H "x-seed-secret: YOUR_SEED_SECRET"

# 3. Check admin login
# Visit: https://your-vercel-domain.vercel.app/login
# Email: admin@your-domain.com
# Password: Demo12345!
```

## Step 5: Configure Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records (Vercel provides instructions)
4. Update `NEXTAUTH_URL` environment variable to your domain

## Step 6: Stripe Webhooks (Critical)

Stripe needs to notify your app about payment events:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add Endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events to send: `checkout.session.completed`
3. Copy Signing Secret → Set as `STRIPE_WEBHOOK_SECRET` in Vercel

## Critical Issues & Solutions

### Issue: Build Fails with TypeScript Errors

**Solution:** Check Vercel build logs for specific errors.
- Run `npx tsc --noEmit` locally to find issues
- Fix and redeploy

### Issue: 401 Errors on API Routes

**Solution:** Check environment variables:
```bash
# In Vercel Logs, verify these are not undefined:
# - MONGODB_URI
# - NEXTAUTH_SECRET
```

### Issue: Database Connection Timeouts

**Solution:** MongoDB Atlas IP Whitelist
1. MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allows Vercel)
   - Or add Vercel IPs specifically (less secure but more restrictive)

### Issue: Cloudinary Upload Failures

**Solution:** 
- Verify `CLOUDINARY_API_SECRET` is set (not just public key)
- Check Cloudinary folder structure: `greenscape-ar/covers` and `greenscape-ar/models` exist
- Increase upload size limit in Cloudinary dashboard if needed

### Issue: Stripe Webhook Not Triggering

**Solution:**
- Verify endpoint is `https://` (not `http://`)
- Check `STRIPE_WEBHOOK_SECRET` is exactly from Stripe webhook settings
- Test webhook in Stripe Dashboard → Send test event

## Security Checklist

- [ ] `STRIPE_SECRET_KEY` is **never** in frontend code or `.env.local` committed
- [ ] `CLOUDINARY_API_SECRET` is **never** exposed to frontend
- [ ] `SEED_SECRET` is strong and changed after initial seed
- [ ] `NEXTAUTH_SECRET` is different for each environment (dev, staging, prod)
- [ ] `.env.local` is in `.gitignore` and never committed
- [ ] All API keys are from production (not test) accounts for live domain
- [ ] MongoDB IP whitelist is configured appropriately

## Environment-Specific Setup

### Staging Environment

Create a staging deployment:
1. Create `staging` branch in git
2. In Vercel Dashboard → Add production domain → Map to main branch
3. Create staging domain → Map to staging branch
4. Add separate environment variables for staging (test Stripe keys, etc.)

### Development

For local development:
```bash
cp .env.example .env.local
# Fill .env.local with dev values (localhost URLs, test API keys)
npm run dev
```

**Never run production secrets locally. Use test keys.**

## Monitoring & Debugging

### View Logs

```bash
# Option 1: Vercel Dashboard → Deployments → [deployment] → Logs
# Option 2: Use Vercel CLI
vercel logs
# Option 3: View real-time logs during deployment
vercel deploy --prod
```

### Common Log Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB not accessible | Check MONGODB_URI, whitelist Vercel IP |
| `Missing NEXTAUTH_SECRET` | Env var not set | Add to Vercel Environment Variables |
| `Stripe not configured` | STRIPE_SECRET_KEY missing | Add to Vercel |
| `Cloudinary is not configured` | Missing Cloudinary env vars | Add all 3 Cloudinary vars |

## Continuous Deployment

After first deployment:

1. **All pushes to `main` branch auto-deploy** (if configured)
2. **Preview deployments** created for PRs
3. **Environment variables automatically available** to all deployments

To disable auto-deploy: Vercel Dashboard → Settings → GitHub / Git

## Rollback

If deployment breaks:

1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"
4. Or fix issue and redeploy

## Performance Optimization

For production, enable:
- [ ] Edge Caching (Vercel default)
- [ ] ISR (Incremental Static Regeneration) where applicable
- [ ] Image Optimization (Next.js built-in)

Monitor: Vercel Analytics → Performance tab

## Next Steps After Deployment

1. Test all critical flows:
   - [ ] User registration
   - [ ] Plant browsing
   - [ ] AR view
   - [ ] Cart & checkout (test mode)
   - [ ] Admin dashboard

2. Set up monitoring:
   - [ ] Error tracking (Sentry optional)
   - [ ] Performance monitoring (Vercel Analytics)
   - [ ] Database monitoring (MongoDB Atlas alerts)

3. Schedule maintenance:
   - [ ] Backup strategy for database
   - [ ] SSL certificate auto-renewal (automatic with Vercel)
   - [ ] Regular security audits

## Support & Troubleshooting

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Status: https://www.vercelstatus.com
- GitHub Issues: Check vercel/next.js repo

---

**Last Updated:** 2026-04-14
**Next.js Version:** 16.2.3 (check for updates)
