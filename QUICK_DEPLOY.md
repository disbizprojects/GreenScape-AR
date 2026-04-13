# Quick Deploy Reference

**TL;DR - Deploy GreenScape AR to Vercel in 5 minutes**

## 1️⃣ Verify Readiness
```bash
npm run pre-deploy  # Must pass all checks
```

## 2️⃣ Gather Credentials
```
MongoDB URI ..................... mongodb+srv://...
Stripe Secret Key ............... sk_live_...
Stripe Publishable Key ........... pk_live_...
Stripe Webhook Secret ........... whsec_...
Cloudinary Cloud Name ........... your_name
Cloudinary API Key .............. ...
Cloudinary API Secret ........... ...
```

## 3️⃣ Generate Secrets
```bash
openssl rand -base64 32   # → NEXTAUTH_SECRET
openssl rand -hex 32      # → SEED_SECRET
```

## 4️⃣ Set NEXTAUTH_URL
- **Development:** `http://localhost:3000`
- **Production:** `https://your-domain.com` (no trailing slash)

## 5️⃣ Deploy
```bash
# Option A: Push to main branch (if auto-deploy enabled)
git push origin main

# Option B: Manual via Vercel Dashboard
# Visit: https://vercel.com/new → Select repo → Deploy
```

## 6️⃣ Add Environment Variables (Vercel Dashboard)
```
MONGODB_URI
NEXTAUTH_URL
NEXTAUTH_SECRET
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
ADMIN_EMAIL
SEED_SECRET
```

## 7️⃣ After Deploy - Seed DB (First Time Only)
```bash
curl -X POST https://your-vercel-domain.vercel.app/api/seed \
  -H "x-seed-secret: YOUR_SEED_SECRET"
```

## 8️⃣ Test Admin Login
```
Email: admin@your-domain.com
Password: Demo12345!
```

## 9️⃣ Configure Stripe Webhook
```
URL: https://your-domain.com/api/webhooks/stripe
Events: checkout.session.completed
Copy Signing Secret → STRIPE_WEBHOOK_SECRET in Vercel
```

## 🔟 Verify Success
- [ ] Homepage loads
- [ ] Can browse plants
- [ ] Can add to cart
- [ ] No 5xx errors in logs

---

**Need more details?** See:
- [DEPLOYMENT_READINESS.md](./DEPLOYMENT_READINESS.md) - Complete status
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full guide with troubleshooting
- [PRE-DEPLOYMENT-CHECKLIST.md](./PRE-DEPLOYMENT-CHECKLIST.md) - Step-by-step

**Something broken?** See Phase 9 in PRE-DEPLOYMENT-CHECKLIST.md for common issues.
