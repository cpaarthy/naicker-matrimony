# V9.2 Match Details Integration

The MatchDetails component is now imported by Browse, ProfileDetails and Dashboard
when those pages exist. A standalone MatchDetailsPage is also included.

Display:
- Match percentage
- Age 35%
- City 25%
- Education 20%
- Occupation 20%
- Tamil + English labels

Use:
<MatchDetails score={matchScore} breakdown={breakdown} tamil={true} />
