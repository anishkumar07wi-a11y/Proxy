# Supabase Setup Guide for Proxy

This guide will walk you through setting up a Supabase project and connecting it to your **Proxy** application. Follow these steps meticulously to establish database schemas, enable real Google Authentication, configure storage buckets, and deploy the application.

---

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in.
2. Click **New Project** and select your organization.
3. Configure the project:
   - **Name**: `Proxy`
   - **Database Password**: *Save this password somewhere safe!*
   - **Region**: Choose the region closest to your users.
   - **Pricing Plan**: Choose **Free** or **Pro** as needed.
4. Click **Create new project** and wait a couple of minutes for your database to provision.

---

## Step 2: Enable Google Authentication

1. In your Supabase Dashboard, navigate to **Project Settings** (gear icon) > **Authentication**.
2. Click on the **Providers** tab and find **Google**.
3. Toggle Google login to **Enabled**.
4. To set up Google Auth, you need a Google OAuth Client ID and Secret:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project called `Proxy`.
   - Go to **APIs & Services** > **OAuth consent screen**. Configure your app's consent details (User Type: External, App Name, User Support Email, etc.).
   - Go to **APIs & Services** > **Credentials**.
   - Click **Create Credentials** > **OAuth client ID**.
   - **Application Type**: Web application.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for local development)
     - `https://your-preview-url.run.app` (your AI Studio preview URL)
   - **Authorized redirect URIs**:
     - Copy the **Callback URL** displayed in your Supabase Google Auth Provider panel. It will look like:
       `https://<your-project-id>.supabase.co/auth/v1/callback`
     - Click **Save** and copy the generated **Client ID** and **Client Secret**.
5. Paste the **Client ID** and **Client Secret** into your Supabase Google Auth configuration panel and click **Save**.

---

## Step 3: Run the SQL Schema

1. In your Supabase Dashboard, navigate to the **SQL Editor** tab (terminal icon on the sidebar).
2. Click **New Query**.
3. Open the `/supabase-schema.sql` file in your project codebase and copy its entire contents.
4. Paste the SQL code into the editor.
5. Click **Run** (or press CMD/Ctrl + Enter).
6. Ensure the query runs successfully. This will:
   - Create all 10 required tables.
   - Establish appropriate relationships, constraints, and foreign keys.
   - Create the automatic student profile sync trigger on Auth signup.
   - Seed the 10 supported colleges.
   - Set up optimal database indexes for search performance.
   - Enable Row Level Security (RLS) policies to protect student data and limit write-actions to Admins.

---

## Step 4: Create Storage Buckets

To store PDF resources and learning assets, you need to create three distinct Storage Buckets:

1. In your Supabase Dashboard, navigate to **Storage** (bucket icon on the sidebar).
2. Click **New Bucket** and configure the first one:
   - **Bucket Name**: `notes`
   - **Allowed MIME types**: `application/pdf`
   - **Public Bucket**: **Enabled** (this allows students to preview/download via URL, while RLS controls uploads).
   - Click **Create bucket**.
3. Click **New Bucket** again for papers:
   - **Bucket Name**: `papers`
   - **Allowed MIME types**: `application/pdf`
   - **Public Bucket**: **Enabled**.
   - Click **Create bucket**.
4. Click **New Bucket** again for learning assets:
   - **Bucket Name**: `learning-assets`
   - **Allowed MIME types**: `application/pdf` (or leave empty to allow images/videos as well).
   - **Public Bucket**: **Enabled**.
   - Click **Create bucket**.

### Storage Security Policies (MANDATORY)

To ensure that *only* the Admin can upload files, and students can only download/preview, set up the following policies for each of the three buckets (`notes`, `papers`, `learning-assets`):

1. Under the bucket settings, click **Policies**.
2. For **Allowed Actions** (Insert, Update, Delete):
   - Click **New Policy** > **For full customization**.
   - **Name**: `Only Admins can write`
   - **Allowed operations**: `INSERT`, `UPDATE`, `DELETE`
   - **Target roles**: `authenticated`
   - **Using expression**:
     ```sql
     (exists (select 1 from public.admins where (admins.email = (auth.jwt() ->> 'email'::text))))
     ```
3. For **Read Access** (Select):
   - Click **New Policy** > **For full customization**.
   - **Name**: `Anyone authenticated can read`
   - **Allowed operations**: `SELECT`
   - **Target roles**: `authenticated`
   - **Using expression**:
     ```sql
     true
     ```

---

## Step 5: Configure Authentication Redirects

1. Go to **Authentication** > **URL Configuration** in your Supabase Dashboard.
2. In the **Site URL** input, enter your production URL (or `http://localhost:3000` during dev).
3. In the **Redirect URLs** list, add your development URLs and shared environment URLs:
   - `http://localhost:3000/**`
   - `https://your-preview-url.run.app/**`
   - `https://your-shared-app-url.run.app/**`
4. Click **Save**.

---

## Step 6: Add Environment Variables

In your project root, create a file named `.env` (or set these inside your environment/hosting platform) and populate it with your Supabase credentials and administrative email:

```env
# Supabase Project Connection Details
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key"

# Admin Configuration (The ONLY administrator email)
ADMIN_EMAIL="anishkumar.07wi@gmail.com"

# App URL for absolute routes
APP_URL="https://your-preview-url.run.app"
```

---

## Step 7: Run the Application

Once variables are set, install all dependencies and start the local development server:

```bash
npm install
npm run dev
```

Your premium engineering platform will start on [http://localhost:3000](http://localhost:3000).

---

## Step 8: Deploy to Vercel

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and click **Add New** > **Project**.
3. Import your `Proxy` repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_EMAIL`
   - `APP_URL` (Set this to your vercel deployment URL: `https://your-project.vercel.app`)
5. Click **Deploy**. Vercel will build and host your production-ready platform instantly!
