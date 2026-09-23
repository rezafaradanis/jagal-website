# JAGAL FC Official Website

Production website for JAGAL FC with EA FC Pro Clubs live statistics, Supabase archive, trial applications and admin tools.

- Club ID: 438867
- Platform: common-gen5
- Public: /
- Admin: /admin.html

## Deployment

1. Create a Supabase project and run `supabase/schema.sql`.
2. Configure `public/config.js` with the Supabase project URL and publishable key.
3. In Vercel, set `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
4. Deploy this repository.
5. Create a Supabase Auth user and insert its UUID into `public.admin_users`.

The EA Pro Clubs endpoint used by the server is community-documented/unofficial and may change or block requests.
