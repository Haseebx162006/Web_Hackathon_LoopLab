# Deploy Frontend To Vercel

This guide deploys only the frontend app from `frontend`.

## 1) Prerequisites

- Frontend code pushed to GitHub.
- Backend API already deployed (for example on Render).
- Backend CORS configured to allow your Vercel frontend domain.

## 2) Create Project On Vercel

1. Open Vercel dashboard.
2. Click `Add New` -> `Project`.
3. Import your GitHub repository.
4. Configure project settings:
   - Framework Preset: `Next.js`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

## 3) Environment Variables (Required)

Add this env var in Vercel Project Settings -> Environment Variables:

- `NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com/api`

Apply it to all environments you use (`Production`, `Preview`, `Development`).

## 4) Deploy

1. Click `Deploy`.
2. Wait for build and deployment to finish.
3. Open your Vercel URL and verify login, products, cart, and chat pages.

## 5) Connect Frontend URL Back To Backend

After Vercel gives you your frontend URL:

1. In Render backend env vars, set both:
   - `FRONTEND_URL=https://<your-frontend>.vercel.app`
   - `CORS_ORIGIN=https://<your-frontend>.vercel.app`
2. Redeploy backend.

## 6) Optional Custom Domain

1. Add custom domain in Vercel Project Settings -> Domains.
2. Update backend env vars (`FRONTEND_URL`, `CORS_ORIGIN`) to that custom domain.
3. Redeploy backend again.

## 7) Troubleshooting

- 401/403 after deploy: verify JWT flow and that frontend points to the correct backend URL.
- CORS errors: backend `CORS_ORIGIN` must exactly match frontend origin.
- Chat socket not connecting: verify `NEXT_PUBLIC_API_URL` points to your backend and backend is healthy.
