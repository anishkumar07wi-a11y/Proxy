# Hub4Buddies

**Learn • Build • Connect • Grow**

Hub4Buddies is a student community and resource platform designed to bring academics, practical skills, projects, community and career exploration into one place.

## What students can use it for

- **Academic resources** — notes, previous papers, important questions, model papers, lab manuals, assignments, syllabus, question banks and references.
- **Multiple education areas** — School/SSLC, PUC, Engineering, BBA, BCA, B.Com, B.Pharm, D.Pharm, Nursing and Medical.
- **Skills** — AI, coding, ECE, embedded systems, IoT, VLSI, GitHub and project building.
- **Learning paths** — structured routes for learning technologies and career skills.
- **Community showcase** — students can submit projects and achievements for review.
- **Career exploration** — resume, LinkedIn, hackathons, startup exposure and opportunities when available.

## Architecture

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Google OAuth

The new academic data model is:

**Education Area → Program → Class / Year / Semester → Subject → Resource**

This keeps the platform flexible instead of assuming every student is an engineering student.

## Getting started

```bash
npm install
npm run dev
```

Then configure Supabase using [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md).

## Admin

The initial admin account is configured as:

`anishkumar.07wi@gmail.com`

Database RLS remains the real protection for administrative writes; the frontend admin screen is only the management interface.

## Project direction

The platform follows a practical loop:

**LEARN → BUILD → SHOW → CONNECT → OPPORTUNITY**

Hub4Buddies does not promise internships simply for joining. Opportunities are shown when there is a real opening and the student is eligible.
