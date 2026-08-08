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
   This creates: `profiles`, `requests`, `favourites`, `contact_messages`, `master_lists` tables,
   all security policies, and the `profile-photos` storage bucket.

   **If your database is already live**, don't re-run the whole script — see the
   migration block in the comments at the top of `supabase-setup.sql` instead,
   which adds the new columns/tables without touching your existing data.

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
- [ ] Log in as **Admin** (bottom of the home page → "Admin login", password `Naik@1998!`) →
      approve the profile
- [ ] Browse profiles, use search and filters
- [ ] Open a profile, add it to Favourites, send an Interest Request
- [ ] From the second account, accept the request → confirm the requester's **address** (city/state) becomes visible (phone number is never shown to members — only the admin sees it, in the Admin Dashboard)
- [ ] Toggle Dark Mode from the header icon
- [ ] Submit a message on Contact Us
- [ ] Admin: select multiple pending profiles and try **bulk approve/reject/delete**
- [ ] Admin: click **Export all profiles (CSV)** and confirm a file downloads
- [ ] Admin: **deactivate** a test account, then try browsing as that user — confirm the block message shows
- [ ] Admin: reply to a Contact Us message and mark it resolved
- [ ] Admin: check the **Activity Log** tab shows your recent actions
- [ ] Register a **Phone + password** account, note the "Mother's name" you set
- [ ] Log out, then on the Login page click **"Forgot password?"** → enter phone + mother's name + a new password → confirm you can log in with the new password
- [ ] Send an interest request from account A to account B → log in as B → check **Notifications** shows it
- [ ] Accept/decline the request as B → log in as A → check **Notifications** shows the response
- [ ] Go to **Dashboard → Account Settings** → change your password → log out and back in with the new password
- [ ] Check the **profile completeness %** bar on the Dashboard updates as you fill in more fields
- [ ] Open a profile → tap **Report** → submit → confirm it appears under Admin → **Reports**
- [ ] Open a profile → tap **Block** → confirm that profile disappears from Browse → unblock to restore it
- [ ] View a few profiles, then check **Dashboard → Recently Viewed** shows them in order
- [ ] Fill in your Partner Preference fields (age range, education, occupation) in Edit Profile → check Browse shows a **"Recommended for you"** section
- [ ] Try **Dashboard → Account Settings → Delete my account** (test account only!) → confirm it logs you out and the profile is gone
- [ ] On an approved profile, click **"Share my profile"** on the Dashboard → copy the link (or scan the QR with another phone) → open it while logged out → confirm it asks you to log in first, then shows the profile after logging in
- [ ] Admin: go to **Announcement** tab → post a message (with or without an expiry date) → confirm it shows as a banner at the top of every page → dismiss it (X) → confirm it stays dismissed for that browser session → confirm it reappears after the session ends or on another device
- [ ] With an existing approved profile (say, a Female account) already registered, register a new opposite-gender (Male) account with a Match Score of 25%+ against her → Admin approves the new profile → confirm the existing Female account gets a "New match found!" notification
- [ ] Fill in **Star** and **Rasi** (Horoscope Details) on two approved profiles of opposite gender → open one profile's details and click **"View Porutham"** → confirm all 10 poruthams display with a verdict
- [ ] Admin: go to **Porutham Check** tab → select the same two profiles → confirm the same calculated result appears → save an "Approved by astrologer" or "Rejected" verdict with notes → confirm both members get a notification, and the review appears under "Past reviews"
- [ ] Admin: **Overview** tab → confirm the registrations bar chart, gender donut chart, and status donut chart render with real numbers
- [ ] Admin: **Overview** tab → check the "User engagement" numbers (Active/Inactive/Very inactive) make sense given how recently your test accounts logged in
- [ ] Admin: **All Profiles** tab → type into the search box (try a name or city) and use the status dropdown → confirm the list filters correctly
- [ ] Admin: **All Profiles** tab → click on a profile row (not the icon buttons) → confirm a detailed view opens showing all fields, their interest requests (sent & received), and any reports
- [ ] Admin: **Overview** tab → click **"Backup full database (JSON)"** → confirm a `.json` file downloads containing all tables (open it in a text editor to check)
- [ ] Log in as a member → **Dashboard → FAQ** → confirm questions expand/collapse and content is bilingual

## About the Full Database Backup

The "Backup full database (JSON)" button on the Admin Overview tab downloads a
complete snapshot of every table (profiles, requests, favourites, notifications,
reports, activity log, master lists, announcements, contact messages, and
Porutham reviews) as a single JSON file. This is a **download-only backup** —
there is no "restore from file" button in the app, since re-importing data
safely (handling duplicate IDs, foreign key relationships, etc.) is risky to
automate. If you ever need to restore from a backup, the safest approach is to
open the JSON file, extract what's needed, and re-insert it manually via the
Supabase dashboard's **Table Editor** or **SQL Editor** — or restore your whole
project using Supabase's own point-in-time backup feature (Project Settings →
Backups), which is the more reliable option for full disaster recovery.

Note: profile **photos** are stored in Supabase Storage, not in these database
tables, so this JSON backup does not include image files — only the URLs
pointing to them.

## About User Engagement Metrics

The "Active/Inactive" counts on the Admin Overview tab are based on a new
`last_active_at` timestamp, which is updated every time a member opens the app
while logged in. **Existing accounts will show as "Inactive" until they log in
again after this update** — this is expected, since there's no prior activity
timestamp to look back on. Going forward, the numbers will be accurate.

## About the Porutham (Horoscope Matching) Feature

The 10-Porutham calculation (Dina, Gana, Mahendra, Sthree Dheergha, Yoni, Rasi,
Rasi Adhipathi, Vasiya, Rajju, Vedha) is computed from each member's **Star** and
**Rasi** fields using standard Tamil astrology reference tables. This is a useful
first-pass screening tool, **not a substitute for a qualified astrologer** —
the app displays a disclaimer to this effect on the Porutham page itself, and the
Admin "Porutham Check" tab lets an astrologer record a manual verdict that
overrides/supplements the automatic calculation for record-keeping.

If members enter Star/Rasi names in unfamiliar spellings (Sanskrit vs. Tamil
names, e.g. "Ashlesha" vs. "Ayilyam"), the calculator recognizes common
variants, but very unusual spellings may not match — in that case the Porutham
page will show a message asking to check the spelling.

## Password Recovery for Phone Accounts (SQL only, no CLI needed)

Members who sign up with **Phone + password** set a security answer ("Mother's name")
during registration. If they forget their password, they can use the **"Forgot
password?"** link on the Login page — enter phone number + mother's name + a new
password, and it resets immediately. No admin involvement, no CLI, no Edge Functions.

This works via a small Postgres function that's included in `supabase-setup.sql` (and
in `migration-only.sql` if you're updating an existing database). It's deployed just by
running the SQL in the Supabase SQL Editor — nothing else to install or configure.

**Note:** members who sign up with **Email OTP** don't need this — if they're ever
signed out, they just log back in with a fresh OTP code.

## Notes / things to change before going live

- **Change the admin password.** It's hardcoded in `src/pages/AdminDashboard.jsx` as
  `const ADMIN_PIN = "Naik@1998!";` — change this before sharing the site publicly.
  If you use the password-reset feature, also update the matching constant in
  `supabase/functions/admin-reset-password/index.ts` and redeploy the function.
- **Admin data protection**: the current setup allows any authenticated request
  to update profile status (approve/reject), gated only by the PIN inside the
  app's UI, not by the database. This is fine for a small trusted community
  site, but if you want database-level admin protection, that requires a
  proper Supabase "admin" role — ask if you'd like this added.
- Contact messages are stored in the `contact_messages` table — view them in
  Supabase → **Table Editor** → `contact_messages`.
- Free tier limits: Supabase free gives 500MB database + 1GB file storage;
  Netlify free gives 100GB bandwidth/month. Fine for getting started.
