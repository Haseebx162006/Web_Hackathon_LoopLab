# Deploy Backend To Render (Production)

This guide deploys only the backend API from `backend/app`.

## 1) Prerequisites

- Backend code pushed to GitHub.
- MongoDB connection string (Atlas recommended).
- A strong JWT secret.

## 2) Fastest Option: Use Blueprint (`render.yaml`)

A ready blueprint exists at `render.yaml` in the project root.

1. Go to Render dashboard.
2. Click `New +` -> `Blueprint`.
3. Connect your GitHub repo.
4. Render will detect `render.yaml` and create the backend service.
5. Fill all required environment variables (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`).
6. Deploy.

## 3) Manual Option: Create Web Service

If you do not use blueprint:

1. Render -> `New +` -> `Web Service`.
2. Connect repo.
3. Configure:
   - `Root Directory`: `backend/app`
   - `Runtime`: `Node`
   - `Build Command`: `npm ci`
   - `Start Command`: `npm start`
4. Add environment variables listed in section 4.
5. Deploy.

## 4) Required Environment Variables

Minimum required in production:

- `NODE_ENV=production`
- `MONGODB_URI=<your mongodb uri>`
- `JWT_SECRET=<long random secret>`
- `FRONTEND_URL=https://your-frontend-domain.com`
- `CORS_ORIGIN=https://your-frontend-domain.com`

Optional:

- `GROQ_API_KEY` (AI support chat)
- `WEBHOOK_SECRET` (validates checkout webhook requests)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (image uploads)
- OAuth variables (Google/Facebook/GitHub) if you use social login

Recommended:

- `NODE_VERSION=20` (stable runtime for Render)

Use `backend/app/.env.example` as full reference.

## 5) Update OAuth Callback URLs (if using OAuth)

In each OAuth provider dashboard, replace localhost callbacks with your Render backend URL:

- `https://<your-backend>.onrender.com/api/auth/oauth/google/callback`
- `https://<your-backend>.onrender.com/api/auth/oauth/facebook/callback`
- `https://<your-backend>.onrender.com/api/auth/oauth/github/callback`

Also set these same values in Render env vars:

- `GOOGLE_CALLBACK_URL`
- `FACEBOOK_CALLBACK_URL`
- `GITHUB_CALLBACK_URL`

## 6) Health Check & Verification

After deploy, verify:

- Base URL: `https://<your-backend>.onrender.com/`
- Health: `https://<your-backend>.onrender.com/health`

Expected `/health` response:

```json
{
  "success": true,
  "status": "ok"
}
```

## 7) Frontend Integration

On your frontend host, set:

- `NEXT_PUBLIC_API_URL=https://<your-backend>.onrender.com/api`

Then redeploy frontend.

## 8) Production Notes

- This backend is configured with proxy-aware settings (`trust proxy`) for Render.
- Graceful shutdown handling is enabled for Render restart/scale events.
- WebSockets (Socket.IO) run on the same Render web service URL.
- Free tier sleeps when idle; first request can be slow.

## 9) Troubleshooting

- `CORS error`: ensure `CORS_ORIGIN` exactly matches frontend URL (protocol + domain).
- `Mongo connection failed`: verify `MONGODB_URI` and network access/IP allowlist in Atlas.
- `401 invalid token`: ensure same `JWT_SECRET` is used by all running instances.
- OAuth redirect mismatch: update provider callback URL and Render callback env vars.
- Render deploy shows an old commit hash: run `Manual Deploy` -> `Clear build cache & deploy` and confirm the deploy log checkout commit matches your latest GitHub commit on `main`.
- Render uses Node 22 unexpectedly: set `NODE_VERSION=20` in Render env vars (or deploy via `render.yaml` that pins Node 20).
- `Cannot find module` on Render but works on Windows: verify import path casing matches file casing exactly; Linux is case-sensitive.
