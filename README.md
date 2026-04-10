# GreenScape AR

Next.js marketplace for browsing plants, placing **real-device AR** previews (WebXR / Scene Viewer / AR Quick Look via `@google/model-viewer`), and running **sunlight**, **weather**, and **survival** heuristics tied to a map pin (OpenStreetMap + Open-Meteo — no paid map/weather keys required).

## Stack

- **Framework:** Next.js (App Router), TypeScript  
- **UI:** Tailwind CSS  
- **Database:** MongoDB with Mongoose  
- **Auth:** NextAuth (credentials)  
- **Payments:** Stripe Checkout (optional in dev)  
- **AR:** `@google/model-viewer` + hosted **GLB** URLs per plant  

## Prerequisites

- Node.js 20+  
- MongoDB running locally or a hosted URI (Atlas, etc.)

## Setup

1. Copy `.env.example` to `.env.local` and set `MONGODB_URI`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (for local dev: `http://localhost:3000`).

2. Install and run:

```bash
npm install
npm run dev
```

3. Seed demo users and plants (set `SEED_SECRET` in `.env.local` to match):

```bash
curl -X POST http://localhost:3000/api/seed -H "x-seed-secret: YOUR_SEED_SECRET"
```

Demo logins (after seed):

- **Admin:** `ADMIN_EMAIL` from env (default `admin@greenscape.local`) / `Demo12345!`  
- **Vendor:** `vendor@greenscape.local` / `Demo12345!`  
- **Customer:** `customer@greenscape.local` / `Demo12345!`  

## Vendor uploads (Cloudinary)

Cover photos and **`.glb`** models are uploaded from **Vendor studio** via `POST /api/upload` (vendors/admins only). Add **`CLOUDINARY_CLOUD_NAME`**, **`CLOUDINARY_API_KEY`**, and **`CLOUDINARY_API_SECRET`** from the Cloudinary dashboard to `.env.local`, then restart the dev server. If Cloudinary is not set, the form shows a notice and you can still paste HTTPS URLs under **Optional: paste URL instead**.

## Stripe (optional)

Add `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET`. Point the webhook to `/api/webhooks/stripe`. Without keys, checkout shows a clear error — orders can still be created for UI testing if you add a manual “mark paid” path later.

## AR on phones

- **Android (Chrome):** open any **AR experience** route; use **View in your space** when the browser offers it (WebXR / Scene Viewer).  
- **iOS (Safari):** AR Quick Look is used when the browser and model support it.  
- Replace demo GLB URLs in seed/vendor forms with your own plant assets for production.

## Plant disease scan

Set `PLANT_ID_API_KEY` for live identification; otherwise `/api/disease` returns a structured mock response.

## Project layout (high level)

- `src/app` — pages (marketplace, AR workspace, dashboards, auth)  
- `src/app/api` — REST handlers (plants, cart, orders, analysis, Stripe, admin)  
- `src/models` — Mongoose schemas  
- `src/lib` — weather (Open-Meteo), sunlight heuristics (`suncalc`), survival scoring  
- `src/components` — `ModelViewerPlant`, Leaflet map  

## Deploy (Vercel)

Set environment variables in the Vercel project. Use a MongoDB Atlas URI for `MONGODB_URI`. Configure Stripe webhook URL for production.
