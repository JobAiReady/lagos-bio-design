# Backup & Restore Procedures

## Supabase Database

### Automated Backups (Supabase-managed)
Supabase automatically creates daily backups on Pro plans and above. On the free tier, there are **no automated backups**.

**Current plan**: Free tier — manual backups required.

### Manual Database Export

Export the full database:
```bash
# Requires Supabase CLI linked to the project
npx supabase db dump -p YOUR_DB_PASSWORD > backup_$(date +%Y%m%d).sql
```

Export specific tables:
```bash
# User progress data
npx supabase db dump -p YOUR_DB_PASSWORD --data-only -t user_progress > user_progress_backup.sql

# Rate limits (system table, low priority)
npx supabase db dump -p YOUR_DB_PASSWORD --data-only -t rate_limits > rate_limits_backup.sql
```

### Restore from Backup
```bash
# Connect to Supabase PostgreSQL and run the backup SQL
psql "postgresql://postgres:YOUR_DB_PASSWORD@db.hvxkrsxckbslotqopodz.supabase.co:5432/postgres" < backup_file.sql
```

### Recommended Schedule
| What | Frequency | Method |
|------|-----------|--------|
| Full DB dump | Weekly | Manual CLI export |
| User progress table | Before any migration | Manual CLI export |
| Auth users | Monthly | Supabase Dashboard > Authentication > Export |

---

## Frontend Code

### Source Code
All source code is in GitHub: `JobAiReady/lagos-bio-design`

```bash
git clone https://github.com/JobAiReady/lagos-bio-design.git
```

### Environment Variables
Stored in `.env` (not committed). Keep a secure copy of:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ACCESS_CODE`

### Netlify Deployment
Netlify keeps deployment history. You can roll back to any previous deploy from the Netlify dashboard:
- Dashboard: https://app.netlify.com/projects/lagos-bio-design/deploys

---

## Supabase Edge Functions

Edge function source is in `supabase/functions/ai-chat/index.ts`.

Redeploy after restore:
```bash
npx supabase functions deploy ai-chat
```

Secrets to re-set if migrating to a new project:
```bash
npx supabase secrets set GEMINI_API_KEY=your_key_here
```

---

## Disaster Recovery Checklist

If you need to rebuild from scratch:

1. **Create new Supabase project** at supabase.com
2. **Run all migrations** in order:
   ```bash
   psql $NEW_DB_URL < supabase/migrations/001_add_user_progress_table.sql
   psql $NEW_DB_URL < supabase/migrations/20251127_verify_cohort_code.sql
   psql $NEW_DB_URL < supabase/migrations/20251127_analytics_schema.sql
   psql $NEW_DB_URL < supabase/migrations/20251223_rate_limiting.sql
   psql $NEW_DB_URL < supabase/migrations/20260401_admin_roles.sql
   ```
3. **Deploy edge function**: `npx supabase functions deploy ai-chat`
4. **Set secrets**: `npx supabase secrets set GEMINI_API_KEY=...`
5. **Update `.env`** with new Supabase URL and anon key
6. **Deploy to Netlify**: `npx netlify-cli deploy --prod --dir=dist`
7. **Update DNS** if Supabase URL changed
8. **Re-create admin user** and run `check_admin_role` RPC
