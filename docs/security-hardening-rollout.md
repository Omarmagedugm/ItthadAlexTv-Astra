# Security hardening rollout

This draft contains metadata HTML/JSON-LD escaping for both HTTP handlers, authenticated Storage writes, bounded public engagement updates, member-owned like transitions, transactional fan-post likes, authenticated comment/order ownership, and Workbox exclusions for API and SEO resources.

## Validation
- TypeScript check and production build.
- Existing 9 security checks and metadata injection regression test.
- Live robots.txt and sitemap.xml return HTTP 200 with text/plain and application/xml respectively. The earlier browser redirect observation is not evidence of a server failure.
- Firebase rules must still be validated in the Firebase emulator and deployed to the intended named database and Storage bucket; committing rules does not activate them.

## Still open — do not represent this draft as a complete audit remediation
- users documents remain public. Existing username login queries email from users before authentication, and rankings/FanZone read the same collection. Split public profile data from private fields, seed the public collection, replace public queries, provide a server-only username sign-in flow, then restrict users reads to owner/authorized staff. This needs an authorized Firebase Admin runtime and a controlled data migration.
- Game scores and stats remain client-authoritative. Moving writes to an authenticated Admin endpoint alone does not prevent fabricated game results. Add server-issued run sessions and validated game progression, prevent client writes to authoritative score fields, migrate existing records without resetting them, and verify runner/zombie unlocks.
- Poll votes, some social counters and other role-specific collections still need per-member transition validation and abuse controls. Single-step view increments are bounded, not rate limited.
- Server rendering of non-news public pages and richer social previews remain SEO follow-up work.

Keep this PR in draft until these remaining security paths and Firebase emulator checks are complete. Deploy the app and database rules in a coordinated rollout. Preserve the locked PWA icon and manifest settings in AGENTS.md.
