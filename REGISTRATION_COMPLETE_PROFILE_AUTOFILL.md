# Registration → Complete Profile Auto-Fill

Registration Step 1 details are persisted as a short-lived local draft. After successful account creation, the user is taken directly to Complete/Edit Profile. Existing saved profile data takes precedence, while the registration draft fills any missing fields. The draft is removed after the registration profile is successfully saved.

This is a frontend UX handoff; the authoritative profile remains in Supabase.
