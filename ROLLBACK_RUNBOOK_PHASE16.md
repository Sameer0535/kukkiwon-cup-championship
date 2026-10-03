# PRODUCTION ROLLBACK RUNBOOK — PHASE 16

## Standalone Kukkiwon Cup Championship Platform

This runbook establishes standard operating procedures (SOP) for executing rollbacks in the event of an outage, data corruption, deployment failure, or critical security vulnerability during or after deployment.

---

## 1. Severity Levels & Rollback Triggers

| Level | Condition | Immediate Action |
| :--- | :--- | :--- |
| **SEV-0 (Critical)** | Data corruption, financial discrepancy, payment gateway failure, authentication bypass | **Immediate Rollback** to previous production deployment + disable payment gateway |
| **SEV-1 (High)** | Core championship registration or document upload failure affecting >10% of users | **Rollback or Hotfix** within 30 minutes |
| **SEV-2 (Medium)** | Non-blocking admin dashboard defect or reporting inconsistency | **Schedule patch release** without full rollback |

---

## 2. Vercel Hosting Rollback (Immediate — < 2 Minutes)

Vercel preserves previous deployment artifacts indefinitely, enabling instant atomic rollbacks without rebuilding.

### Method A: Vercel Dashboard (Instant GUI Rollback)
1. Go to **Vercel Dashboard** → Select **kukkiwon-cup-championship**.
2. Navigate to the **Deployments** tab.
3. Locate the last known healthy deployment (e.g., Commit `53c228a85e4ab377a9fd26b9fe077427f6e726cd` Phase 15 Baseline).
4. Click the three dots (`...`) next to the deployment → Select **Instant Rollback**.
5. Confirm promotion to production. Vercel immediately redirects 100% of incoming edge traffic to the previous build.

### Method B: Vercel CLI (Headless Command Line)
```bash
# 1. List recent deployments to identify target deployment ID
npx vercel deploy ls --prod

# 2. Promote previous healthy deployment ID to production alias
npx vercel rollback [PREVIOUS-DEPLOYMENT-ID]

# Or re-alias directly:
npx vercel alias set [PREVIOUS-DEPLOYMENT-URL] kukkiwoncup.org
```

---

## 3. Database Rollback Procedures

> [!CAUTION]
> Never execute `prisma migrate reset` or drop tables on a production database during incident recovery. Any uncoordinated schema revert can cause irreversible data loss for participants registered during the active window.

### Step 3.1: Assessment
Before altering the database:
1. Determine if incoming registrations or payments were recorded during the fault window:
   ```sql
   SELECT count(*) FROM "Registration" WHERE created_at > NOW() - INTERVAL '2 hours';
   SELECT count(*) FROM "Payment" WHERE created_at > NOW() - INTERVAL '2 hours';
   ```
2. If new payments were received, **DO NOT** execute a blind database restore. Export new transactions first:
   ```bash
   pg_dump -h [HOST] -U postgres -d postgres -t '"Payment"' -t '"Registration"' --data-only > emergency_delta_backup.sql
   ```

### Step 3.2: Point-In-Time-Recovery (PITR) via Supabase / Managed RDS
If catastrophic schema corruption occurred:
1. In the Supabase Dashboard, go to **Database** → **Backups** → **Point in Time Recovery**.
2. Select the timestamp immediately preceding the problematic migration.
3. Restore into a **new recovery instance** (e.g. `kukkiwon-cup-restored`).
4. Validate schema and table counts on the restored instance.
5. Merge any new registrations captured during the outage window from `emergency_delta_backup.sql`.
6. Update `DATABASE_URL` and `DIRECT_URL` in Vercel to point to the restored cluster and trigger a redeploy.

---

## 4. Emergency Maintenance Mode

If an ongoing incident requires pausing public registrations or financial transactions while investigations proceed:

1. **Option A: Vercel Edge Middleware / Maintenance Header**:
   - Set environment variable `MAINTENANCE_MODE="true"` in Vercel Dashboard.
   - Or deploy emergency static maintenance page via Vercel Firewall Rule (Custom Rule: redirect all traffic except `/api/health` and `/admin/*` to `/maintenance.html`).

2. **Option B: Championship Registration Gate**:
   - In the database, update championship status to `UPCOMING` or `REGISTRATION_CLOSED`:
     ```sql
     UPDATE "Championship" SET status = 'REGISTRATION_CLOSED' WHERE slug = 'kukkiwon-cup-2026';
     ```
   - This immediately halts new submissions while preserving viewer access and draft state.

---

## 5. Post-Rollback Verification Checklist

Following any rollback, execute the following smoke tests before declaring the incident resolved:

- [ ] Verify `GET /api/health` returns HTTP 200 with `status: "HEALTHY"`.
- [ ] Confirm homepage and registration portal render properly.
- [ ] Verify administrative login at `/admin/login` functions.
- [ ] Perform a test registration draft save and confirm persistence.
- [ ] Confirm private document signed URL streaming (`/api/storage/stream`) returns HTTP 200.
- [ ] Check server error logs in Vercel Dashboard for uncaught runtime exceptions.
- [ ] Notify championship leadership and tournament registrars of system status.
