# JAGAL FC Official Website

Production website for JAGAL FC with EA FC Pro Clubs live statistics, Neon PostgreSQL archive, trial applications and admin tools.

- Club ID: 438867
- Platform: common-gen5
- Public: /
- Admin: /admin.html

## Deployment

1. Connect a Neon PostgreSQL database to the Vercel project.
2. Ensure Vercel provides DATABASE_URL to Production and Preview.
3. Run the PostgreSQL schema from `supabase/schema.sql` in the Neon SQL editor (the file name is kept for compatibility only).
4. Set Vercel environment variables:
   - DATABASE_URL (created by Neon integration)
   - ADMIN_EMAIL
   - ADMIN_PASSWORD
   - ADMIN_SESSION_SECRET
5. Deploy.

The EA Pro Clubs endpoint used by the server is community-documented/unofficial and may change or block requests.
