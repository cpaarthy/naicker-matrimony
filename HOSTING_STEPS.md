# Naicker Matrimony — Full Setup & Hosting Guide

This version includes: Home, Register, Login, Browse Profiles, Profile Details,
Dashboard, Edit Profile, Interest Requests, Contact Us, Admin Dashboard, Favourites,
Search & Filters, Photo Upload, Dark Mode, Email OTP login, and Phone+Password login.

Total setup time: ~20 minutes.

## Part 1: Database & Storage (Supabase)

1. Go to https://supabase.com → sign up free → **New project** → name it, set a
   database password (save it), pick nearest region → **Create new project**.
   Wait ~2 minutes for it to provision.

2. Left sidebar → **SQL Editor** → **New query**. Open `supabase-setup.sql` from
   this folder, copy all of it, paste into the editor, click **Run**.
   This creates: `profiles`, `requests`, `favourites`, `contact_messages` tables,
   all security policies, and the `profile-photos` storage bucket.

3. **Important — enable Email OTP:**
   - Left sidebar → **Authentication** → **Sign In / Providers** → make sure
     **Email** provider is enabled.
   - Go to **Authentication** → **Emails** (or **Email Templates**) → open the
     **"Magic Link"** template (Supabase uses this template for OTP emails too).
   - Make sure the template body includes `{{ .Token }}` somewhere (this is the
     6-digit code). If it only shows `{{ .ConfirmationURL }}`, edit the template
     text to display `{{ .Token }}` instead/as well, so users receive a code they
     can type in in the app, not just a clickable link.
   - Save the template.

4. Left sidebar → gear icon **Project Settings** → **API**. Copy:
   - **Project URL**
   - **anon public** key

Keep these handy for Part 3.

## Part 2: Push code to GitHub

1. https://github.com → sign in → **New repository** → name it `naicker-matrimony`.
2. Open the `naicker-web` folder from this project on your computer.
3. On the GitHub repo page, use **Add file → Upload files**, then open the
   `naicker-web` folder and select **everything inside it** (not the folder itself)
   — `src`, `index.html`, `package.json`, `vite.config.js`, `supabase-setup.sql`,
   etc. — and drag them all into the upload box.
4. Commit the changes.
5. Confirm on GitHub that `src/App.jsx`, `src/main.jsx`, `src/pages/`,
   `src/components/`, `src/context/`, and `src/data/` all appear in the repo.

## Part 3: Hosting (Netlify)

1. https://netlify.com → sign in with GitHub → **Add new site** →
   **Import an existing project** → choose your `naicker-matrimony` repo.
2. Build settings (auto-detected, just confirm):
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables (in the same setup screen, or later under
   **Project configuration → Environment variables**):
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
4. Click **Deploy**. Wait 1-2 minutes.
5. Open the live URL Netlify gives you — the app should load fully.

## Testing checklist

- [ ] Register with **Email OTP** — check your inbox for the 6-digit code
- [ ] Register with **Phone + password** on a second account
- [ ] Complete a profile with a photo — confirm the photo appears
- [ ] Log in as **Admin** (bottom of the home page → "Admin login", PIN `1998`) →
      approve the profile
- [ ] Browse profiles, use search and filters
- [ ] Open a profile, add it to Favourites, send an Interest Request
- [ ] From the second account, accept the request → confirm phone number becomes visible
- [ ] Toggle Dark Mode from the header icon
- [ ] Submit a message on Contact Us

## Notes / things to change before going live

- **Change the admin PIN.** It's hardcoded in `src/pages/AdminDashboard.jsx` as
  `const ADMIN_PIN = "1998";` — change this before sharing the site publicly.
- **Admin data protection**: the current setup allows any authenticated request
  to update profile status (approve/reject), gated only by the PIN inside the
  app's UI, not by the database. This is fine for a small trusted community
  site, but if you want database-level admin protection, that requires a
  proper Supabase "admin" role — ask if you'd like this added.
- Contact messages are stored in the `contact_messages` table — view them in
  Supabase → **Table Editor** → `contact_messages`.
- Free tier limits: Supabase free gives 500MB database + 1GB file storage;
  Netlify free gives 100GB bandwidth/month. Fine for getting started.
