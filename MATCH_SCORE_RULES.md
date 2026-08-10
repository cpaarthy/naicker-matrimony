# Correct Match Score

The UI expects `calculateMatchScore(profile, candidate)` to return:
`{ percentage, breakdown }`.

Only four factors contribute:

- Age = 35%
- City = 25%
- Education = 20%
- Occupation = 20%

Examples:
- Age only = 35%
- Age + City = 60%
- Age + Education = 55%
- Age + Occupation = 55%
- City + Education + Occupation = 65%
- Age + City + Education = 80%
- Age + City + Occupation = 80%
- All four = 100%

Categories:
- 90–100 = High
- 50–89 = Medium
- 0–49 = Low
