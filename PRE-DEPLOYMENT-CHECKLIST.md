# Pre-Deployment Checklist

This checklist ensures your GreenScape AR application is ready for production on Vercel.

**Estimated Time:** 30-45 minutes

---

## Phase 1: Prerequisites (5 minutes)

- [ ] GitHub/GitLab account with code pushed to repository
- [ ] Vercel account created at https://vercel.com
- [ ] MongoDB Atlas cluster created with connection string ready
- [ ] Stripe account with test keys for development, live keys for production
- [ ] Cloudinary account with API credentials ready
- [ ] (Optional) Plant.id account if using disease detection

---

## Phase 2: Environment Variables (10 minutes)

### Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET (copy output)
openssl rand -base64 32

# Generate SEED_SECRET (copy output)  
openssl rand -hex 32
```

### Verify .env.local (Local Testing)

- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all values (use test/dev credentials)
- [ ] Verify `.env.local` is in `.gitignore` (not committed)
- [ ] Run `npm run dev` to test locally

### Prepare Production Values

Gather these values:
- [ ] Production MongoDB URI (Atlas → Connect → Connection String)
- [ ] Production domain or Vercel auto-assigned domain
- [ ] Stripe production keys (not test keys)
- [ ] Stripe webhook signing secret
- [ ] Cloudinary credentials (same for dev and prod)
- [ ] Admin email for production
- [ ] Strong SEED_SECRET (from openssl command above)

---

## Phase 3: Code Quality (10 minutes)

### Run Local Verification

```bash
# TypeScript check
npx tsc --noEmit

# Linting
npm run lint

# Build verification
npm run build

# Pre-deployment checks
npm run pre-deploy
```

All should pass ✓

### Manual Code Review

- [ ] No `console.log` debugging statements left in production code
- [ ] No hardcoded URLs (must be relative `/api/...`)
- [ ] No localhost references except in docs
- [ ] All API calls use relative paths
- [ ] Error boundaries implemented for user-facing features

---

## Phase 4: Database Preparation (5 minutes)

### MongoDB Atlas Setup

1. Create cluster → Copy connection string
2. Network → IP Whitelist:
   - [ ] Add `0.0.0.0/0` to allow Vercel (Vercel uses dynamic IPs)
   - **Security Note:** More restrictive: get Vercel IP ranges, but may need updating
3. Database → Create user (if not exists) for app connection
4. Test connection locally with `npm run dev`

### Database Seeding Strategy

- [ ] Plan when to run `/api/seed` (only needs one time)
- [ ] Decide admin username for production
- [ ] Decide seed URL secret (keep it strong)

---

## Phase 5: Third-Party Services (10 minutes)

### Stripe Configuration

1. Get from Stripe Dashboard:
- [ ] Production API Keys (Settings → API Keys)
- [ ] Webhook Signing Secret (Dashboard → Webhooks)

2. Configure Webhook:
- [ ] Create webhook endpoint for `checkout.session.completed`
- [ ] URL: `https://your-domain.com/api/webhooks/stripe` (after deployment)
- [ ] Note signing secret

### Cloudinary Setup (if not done)

1. Get credentials from dashboard:
- [ ] Cloud Name
- [ ] API Key  
- [ ] API Secret

2. Create folders in Cloudinary (optional but organized):
- [ ] `greenscape-ar/covers` (for plant images)
- [ ] `greenscape-ar/models` (for 3D models)

### Plant.id (Optional)

- [ ] Get API key from https://plant.id (if using disease detection)
- [ ] Test with sample image in development

---

## Phase 6: Deployment Setup (5 minutes)

### Connect to Vercel

1. Go to https://vercel.com/new
2. Select your Git provider and repository
3. Confirm project name: `greenscape-ar`
4. Click "Import"

### Configure Environment Variables in Vercel

In Vercel Dashboard, go to: **Project Settings → Environment Variables**

Add all variables:
```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate new>
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ADMIN_EMAIL=admin@your-domain.com
SEED_SECRET=<generate new>
```

- [ ] Verify **all** variables are added
- [ ] Double-check secret values for typos
- [ ] Ensure production keys are used (not test keys)

---

## Phase 7: Deployment (5 minutes)

### Initial Deploy

- [ ] Click "Deploy" in Vercel Dashboard (or push to main branch if auto-deploy enabled)
- [ ] Wait for build to complete
- [ ] Check build logs for errors

### Build Verification from Logs

Open Vercel Logs and verify:
- [ ] `npm install` completed successfully
- [ ] `npm run build` completed successfully
- [ ] No TypeScript errors
- [ ] All environment variables loaded

---

## Phase 8: Post-Deployment (10 minutes)

### Test Application Access

```bash
# Replace with your actual domain
DOMAIN=your-vercel-domain.vercel.app

# 1. Test homepage
curl https://$DOMAIN

# 2. Test health (should return 200)
curl -i https://$DOMAIN/api/plants
```

### Initialize Database (First Time Only)

```bash
# Seed the database with initial data
curl -X POST https://$DOMAIN/api/seed \
  -H "x-seed-secret: YOUR_SEED_SECRET_FROM_VERCEL"

# Expected response: JSON with seed results
```

### Test Admin Login

1. Visit: `https://your-domain.com/login`
2. Email: `admin@your-domain.com` (from ADMIN_EMAIL)
3. Password: `Demo12345!` (default from seed)
4. [ ] Should successfully log in

### Configure Custom Domain (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add your custom domain (e.g., greenscape.com)
3. Add DNS records as instructed
4. Update `NEXTAUTH_URL` environment variable to new domain
5. Verify after DNS propagation (5-30 minutes)

### Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Update webhook endpoint:
   - **Old URL:** `https://your-vercel-domain-test.vercel.app/api/webhooks/stripe`
   - **New URL:** `https://your-vercel-domain/api/webhooks/stripe` (production domain)
   - Or update after custom domain is live
3. Update `STRIPE_WEBHOOK_SECRET` in Vercel if needed

---

## Phase 9: Critical Verification (5 minutes)

### Security Audit

- [ ] `.env.local` is NOT committed to git
- [ ] `.env.example` has NO real secrets
- [ ] `STRIPE_SECRET_KEY` is NOT visible in browser
- [ ] `CLOUDINARY_API_SECRET` is NOT visible in browser
- [ ] Login works and tokens are secure (check browser cookies/headers)

### Functional Testing

- [ ] Homepage loads
- [ ] Browse plants/marketplace
- [ ] AR view loads model
- [ ] Add to cart works
- [ ] Checkout flow begins (test mode if Stripe test keys)
- [ ] Admin dashboard accessible (with admin account)
- [ ] Disease scan can upload image (may show mock data)

### Performance Check

1. Vercel Dashboard → Analytics → Performance tab
2. Verify:
   - [ ] No 5xx errors
   - [ ] Response times < 500ms
   - [ ] Database queries executing

---

## ⚠️ Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| **Build fails with "Cannot find module"** | Run `npm install` locally, verify all imports are correct |
| **401/403 on API routes** | Check NEXTAUTH_SECRET matches between environments; verify JWT middleware |
| **"Cannot connect to MongoDB"** | Whitelist Vercel IPs in MongoDB Atlas Network Access |
| **Stripe webhook not firing** | Verify endpoint URL and signing secret; test in Stripe dashboard |
| **Cloudinary uploads fail** | Check API Secret is set (**not** just public key); verify folder names |
| **"Undefined environment variable"** | Add to Vercel Environment Variables; redeploy after setting |
| **Slow image loading** | Check Image Optimization in next.config.ts; verify Cloudinary URLs are whitelisted |

---

## 🎉 Deployment Complete!

After all checks pass:

1. **Announce Launch** - Share production URL with stakeholders
2. **Monitor** - Watch Vercel logs for first 24 hours
3. **Gather Feedback** - Test all features reported by users
4. **Setup Backups** - Configure MongoDB backup strategy
5. **Plan Maintenance** - Schedule regular security updates

---

## Post-Launch Maintenance

### Weekly
- [ ] Check Vercel Analytics for errors
- [ ] Review MongoDB logs for issues
- [ ] Monitor Stripe webhook delivers

### Monthly  
- [ ] Update Node.js dependencies: `npm update`
- [ ] Security audit of code changes
- [ ] Database backup verification

### Quarterly
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Update dependencies to latest versions

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Stripe API Docs:** https://stripe.com/docs/api
- **Cloudinary Docs:** https://cloudinary.com/documentation

---

**Last Updated:** 2026-04-14  
**Next.js Version:** 16.2.3  
**Node Version:** 20.x (Vercel default)

### Questions?

Refer to:
1. [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
2. [.env.example](./.env.example) - Environment variable reference
3. Run: `npm run pre-deploy` - Automated verification
