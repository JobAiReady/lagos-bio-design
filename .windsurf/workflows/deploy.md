---
description: How to deploy the Lagos Bio-Design Bootcamp frontend to Cloudflare Workers
---

## Overview
The project is **git-connected** to Cloudflare Workers. Pushes to `main` trigger automatic builds and deploys — no manual steps needed for routine deploys.

- **Primary URL**: https://bootcamp.jobaiready.ai
- **Workers.dev**: https://lagos-bio-design.bitter-credit-3991.workers.dev
- **Config**: `wrangler.jsonc` (SPA routing via `not_found_handling: "single-page-application"`)

## Auto-Deploy (default)

1. Verify the build passes locally:
// turbo
```bash
npm run build
```

2. Commit and push to `main`:
```bash
git add -A
git commit -m "your commit message"
git push origin main
```

3. Cloudflare auto-builds: `npm run build` → `npx wrangler deploy` → live.

4. Verify the live site at https://bootcamp.jobaiready.ai.

## Manual Deploy (if auto-deploy fails)

1. Build locally:
// turbo
```bash
npm run build
```

2. Deploy with wrangler:
```bash
npx wrangler deploy
```

## Environment Variables
VITE_ vars are inlined at build time by Vite. They are set in the `.env` file locally and picked up during the Cloudflare build step:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ACCESS_CODE`

If env vars change, a rebuild/redeploy is needed.

## Legacy
- `netlify.toml` still exists in the repo but Netlify deploys are **paused**. The old Netlify site was at `lagos-bio-design.netlify.app`.
