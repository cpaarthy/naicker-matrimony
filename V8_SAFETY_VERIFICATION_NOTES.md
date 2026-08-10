# V8 Safety & Verification Upgrade

This V8 package builds on the working V7 Free Membership version.

## Included
- Verified badge is now visible directly on Browse recommendation and profile cards when `is_verified` is true.
- Verified-only search remains available to every Free member.
- Profile Details already provides verification badge, Block/Unblock and Report actions.
- Admin already has Verification and Reports tabs, including approve/reject and review/dismiss workflows.
- Admin account deactivation remains available for moderation.
- Free membership plan now explicitly lists verification and safety tools.

## Database
No new SQL migration is required for these V8 UI changes. The existing V7 verification, reports, blocks and admin RPCs are preserved.

## Deployment
Replace the project files in the existing GitHub repository, commit, push, and allow Vercel to redeploy.
Do not replace the `.git` directory.
