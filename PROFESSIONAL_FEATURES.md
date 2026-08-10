# Naicker Matrimony — Professional Feature Upgrade

This version keeps the existing working matrimony features and adds a professional feature layer.

## Included

- Advanced profile search: age, sub-caste, state, district, city, education, occupation, income, star, rasi, diet, smoking, drinking, verified-only.
- Match Analytics filters: Total, High 90%+, Medium 50–89%, New 30 days, Recently Active 7 days, Nearby.
- Private messaging after an accepted interest request.
- Saved search records.
- Profile verification request + admin approval workflow + verified badge.
- Privacy & safety settings.
- Success Stories page.
- Membership Plans page (UI only; payment gateway is not connected).
- Professional More hub for navigation.
- Admin verification review tab.
- Existing favourites, interests, notifications, recently viewed, blocking, reporting, Porutham, profile sharing, account settings and admin analytics are retained.

## Supabase step

1. Open Supabase → SQL Editor.
2. Run `PROFESSIONAL_MATRIMONY_MIGRATION.sql` once.
3. Keep your existing `supabase-setup.sql` data and policies.
4. Run the existing `seed-star-rasi-master-lists.sql` if star/rasi dropdowns are empty.

## Vercel step

Commit/push the updated project to GitHub. Vercel should automatically build the new commit.

## Payment note

The Membership Plans page is intentionally a safe UI placeholder. Before collecting money, connect a real business payment flow such as Razorpay/UPI using server-side secrets and webhook verification. Do not put secret keys in React source code.
