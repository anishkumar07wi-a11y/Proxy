# Hub4Buddies — Supabase Setup

Hub4Buddies uses Next.js + Supabase Auth, Postgres and Storage.

## 1. Environment variables

Create `.env.local` from `.env.example` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ADMIN_EMAIL=anishkumar.07wi@gmail.com
APP_URL=http://localhost:3000
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

## 2. Google sign-in

In Supabase Dashboard → Authentication → Providers → Google, enable Google and configure the Google OAuth credentials. Add your local and production callback URLs according to the Supabase project settings.

## 3. Database migration

Keep the existing `supabase-schema.sql` for the legacy engineering tables and data. Then run these migrations in order in the Supabase SQL Editor:

1. `supabase-migrations/001_hub4buddies_academic_structure.sql`
2. `supabase-migrations/002_hub4buddies_admin.sql`

The new structure is:

**Education area → Program → Class / Year / Semester → Subject → Resource**

It supports School/PUC, Engineering, BBA/BCA/B.Com, Pharmacy, Nursing and Medical without forcing everything into an engineering branch/semester model.

Resource types include notes, previous papers, important questions, model papers, lab manuals, assignments, syllabus, question banks and references.

## 4. Storage

Create a Supabase Storage bucket named `learning-assets`. The admin dashboard uploads files under `resources/` in this bucket. Configure Storage policies so authenticated users can read resources and only administrators can upload/manage them.

If you already use the older `notes`, `papers` and `learning-assets` buckets, the existing buckets can remain; the new academic resource manager uses `learning-assets`.

## 5. Admin

The initial administrator is:

`anishkumar.07wi@gmail.com`

The database `public.is_admin()` function from the original schema remains the RLS gate for admin writes. The new admin interface also checks the signed-in account before loading the control center.

## 6. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 7. Deployment

Deploy the Next.js application to your preferred host (for example Vercel), then set the same Supabase environment variables in the deployment environment and add the production OAuth redirect URL in Supabase.

## Important

Run the SQL migrations before using the new Academic Hub. Existing engineering tables are intentionally not deleted so old data is not destroyed during the transition.
