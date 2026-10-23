# ITTIHADAWY development report

## Changes included

- Defined the requested 28-zone route in both route and scene lookup data, including the 14 designated coastal zones and the return to Alexandria Stadium.
- Added procedural district landmarks, tram scenery, moving dogs/motorcycles/tuk-tuks, and Misr Station rooftop scenery and obstacle variants.
- Preserved unlocked characters, existing character models and abilities, scoring rules and the original banner image file.
- Added a separate Hamido introduction audio asset from the existing project audio.
- Added an app sign-in check before opening gameplay. The embedded document remains behind an input-blocking gate until the same-origin parent authorizes it. Signing out closes the game frame.
- Restricted the game page's incoming score/exit messages to its own same-origin game iframe and cleared pending results when opening a new session.
- Added syntax validation before writing patched bundles and fixed repeated patch runs deleting an unchanged active bundle.

## Verification

- Game integration and voice tests: 36 passed, 0 failed.
- Security audit: 9 passed, 0 failed.
- Production build: passed. Existing large-chunk warnings remain.
- Active game bundle JavaScript parsing: passed.
- Member access message behavior: rejected wrong origins, wrong frames and unauthorized messages; accepted the authorized parent.
- Re-running the current patch script preserved the active bundle.
- Whitespace/diff checks: passed.

## Remaining acceptance work

This report does not certify completion of all 37 requested visual/gameplay acceptance criteria.

- Browser/WebGL and physical mobile playtesting have not been completed; Chromium is not installed in this environment. Frame rate, scene transitions, obstacle fairness, rooftop landings and absence of rendering failures still require runtime verification.
- Stadium grandstand continuity, gate visibility, banner placement/proportions and removal of the specific blue sign still need a visual acceptance pass.
- Rooftop scenery and specialized obstacles are implemented, but jumping across actual carriage gaps and moving trains have not been verified as a completed feature.
- Saint Marc College's user reference image has not been supplied for architectural matching; current procedural scenery is provisional.
- The 28 route entries are implemented; detailed visual completion of every district is not yet certified.

## Files

- `src/pages/Game.tsx`
- `public/games/ittihadawy/index.html`
- `public/games/ittihadawy/enhancements.js`
- `public/games/ittihadawy/enhancements.css`
- `public/games/ittihadawy/version.json`
- `public/games/ittihadawy/assets/index-60bd2ae7.js`
- `public/games/ittihadawy/audio/hamido-opening.mp3`
- `scripts/patch-embedded-game.mjs`
- `scripts/patch-current-game-prompt.mjs`
- `scripts/lib/game-region-details.mjs`
- `scripts/lib/game-prompt-route.mjs`
- `scripts/lib/game-moving-obstacles.mjs`
- `scripts/lib/game-train-rooftops.mjs`
- `tests/game-integration.test.ts`

No administration dashboard, dashboard API or database integration was changed. Locked PWA assets and original stadium banner source artwork were preserved.

## Follow-up: reuse the signed-in app session

- Replaced the unconditional login wording during initialization with a session-loading state.
- The game now requests access immediately from its signed-in app page instead of waiting for the full iframe load event.
- The existing Firebase account bridge also restores the saved app session for direct game links. No separate sign-in flow was introduced.
- Guest login controls appear only after authentication has resolved to no user. An embedded account bridge cannot revoke a valid in-memory parent session.
- Game and voice tests now include authenticated parent, saved account, guest, wrong-origin and wrong-frame cases: 37 passed.
