# V9.3 Central Match Score

All matching score calculations are centralized in `src/utils/matchScore.js`.

Weights:
- Age / வயது: 35
- City / நகரம்: 25
- Education / கல்வி: 20
- Occupation / வேலை: 20

Browse, Dashboard, Profile Details, Porutham Dashboard and Admin Dashboard
are pointed at the central utility where those screens use match scoring.

Categories:
- 90–100 High
- 50–89 Medium
- 0–49 Low
