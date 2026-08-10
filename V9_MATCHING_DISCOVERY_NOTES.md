# V9 Matching & Discovery

- Centralized match filtering in `src/utils/matchFilters.js`.
- Added Low Compatibility (<50%) and Verified filters.
- Browse now exposes All, High, Medium, Low, New 30 Days, Recently Active, Verified and Shortlisted tabs.
- Shortlisted uses the existing favourites table and member-safe query.
- Existing blocked-profile exclusion, approval gating, partner age/education/occupation preferences and match scoring remain active.
- No paid membership or premium gating was added.
- No messaging or multi-photo gallery was added.


V9 FIXED MATCHING: Discovery category tabs no longer apply strict partner-preference filtering. This prevents High/Medium/Low/New/Active/Verified/Nearby views from becoming empty when a preference is set. Partner preferences remain available for recommended matches.
