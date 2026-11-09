# Independent Football Match Center

Route: /football-center. Existing /matches and predictions are untouched.

The server-only API-Football key lives in Vercel as APISPORTS_KEY (sensitive), not GitHub. Server accepts only GET and allowlisted fixture actions, restricts fixture IDs to Al Ittihad fixtures, caches in Firestore (football_api_cache) with in-process fallback, and returns only public football data.

Toggle from Admin > إظهار أقسام التطبيق > مركز المباريات الذكي. This changes appSettings/sections.footballCenter; disabling hides the navigation and blocks the page, leaving original matches and predictions intact.

First online visit saves fixtures and details to IndexedDB, which the separate page can display offline. Source data availability, lineups and statistics are conditional on provider plan and fixture coverage.

QA: test section on desktop/mobile, team lookup, fixture selection and all 3 tabs, offline restart, toggle off/on, old /matches route, errors and rate limit conditions.
