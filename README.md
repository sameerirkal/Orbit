# Orbit

Orbit is a goal, project, and task workspace built with Next.js and Supabase.
Users can sign up, manage goals, tasks, and projects, see deadlines in a calendar, and review progress in analytics.

## Requirements

- Node.js 20 or later
- npm
- A Supabase project

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. In `.env.local`, add your Supabase project URL and **anon** key. Never use or expose the service-role key in this app.
4. Apply the SQL migration at `supabase/migrations/20261018000000_create_orbit_schema.sql` using the Supabase CLI or SQL Editor.
5. Start the app with `npm run dev` and open `http://localhost:3000`.

## Checks

```bash
npm run lint
npm run build
```

## Security notes

- The database migration enables Row Level Security. Every authenticated user can only access rows whose `user_id` matches their account.
- `.env.local`, build output, logs, and dependencies are excluded by `.gitignore`.
- Public `NEXT_PUBLIC_` values are safe to ship to the browser only when Supabase RLS policies are enabled. Never commit a Supabase service-role key.

## Deployment checklist

1. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the hosting provider.
2. Apply the database migration to the production Supabase project.
3. Verify email-confirmation settings and permitted redirect URLs in Supabase Auth.
4. Run lint and production build before deploying.
