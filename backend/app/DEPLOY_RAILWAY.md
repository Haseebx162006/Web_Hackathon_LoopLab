# Deploy Backend on Railway

This backend can be deployed from the repository root with the included `railway.toml`.

## Required Settings

1. Create a Railway project and connect this GitHub repository.
2. Use the default root directory (repository root).
3. Railway will use:
   - Build command: `npm ci --prefix backend/app`
   - Start command: `npm --prefix backend/app start`
4. Set Health Check Path to `/health` (already defined in `railway.toml`).

## Required Environment Variables

- `NODE_ENV=production`
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGIN`

Optional but recommended when used:

- `GROQ_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- OAuth keys/callbacks for Google, Facebook, GitHub
- `WEBHOOK_SECRET`

## Verify Deployment

After deploy succeeds, open:

- `https://<your-railway-domain>/health`

Expected JSON response includes `status: "ok"`.

## Common Errors

### `npm error Missing script: "start"`

Railway is trying to run at the wrong package level. Keep repository root and use the commands in `railway.toml`, or set service root to `backend/app` and use `npm start`.

### `Cannot find module ...`

Dependencies were not installed in `backend/app`. Confirm build command is `npm ci --prefix backend/app`.