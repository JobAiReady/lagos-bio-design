---
description: How to deploy the Lagos Bio-Design Bootcamp frontend to Netlify
---

## Prerequisites
- Project builds cleanly (`npm run build` produces `dist/`)
- `netlify.toml` exists with build command and publish dir
- Environment variables are known (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ACCESS_CODE)

## Steps

1. Verify the build passes locally:
// turbo
```bash
npm run build
```

2. Ensure `netlify.toml` exists at project root with:
   - `command = "npm run build"`
   - `publish = "dist"`
   - SPA redirect rule (`/* -> /index.html`)

3. Commit any uncommitted changes before deploying.

4. Deploy using the deploy_web_app tool:
   - Framework: Not applicable (Vite+React is not in the list; leave unset or use closest match)
   - ProjectPath: `c:\dev\LBD`
   - Subdomain: `lagos-bio-design` (or as specified by user)

5. After deployment, set environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ACCESS_CODE`
   Note: VITE_ vars are inlined at build time by Vite, so a rebuild/redeploy is needed after setting them.

6. Trigger a redeploy from Netlify after env vars are set.

7. Verify the live site loads and the Supabase connection works.
