# Embedded Ittihadawy integration

The active game build is in `public/games/ittihadawy/index.html`. Its game/account messages use a hidden same-origin `game-account.html` Vite entry. A run is bound to the authenticated member when it starts; a different account cannot inherit it. A Firestore transaction only replaces `users/{uid}.stats.ittihadawyScore` when the result improves. Scores are reported by the browser game, not independently simulated by a server.

The game page lists the top 50 members ordered by that field. Names come from their current member profiles. Only signed-in application members can play; existing app sessions unlock the game without a second login.

## Visits

`game_visits` records actual game entries. Each browser tab combines refreshes within 30 minutes into one visit. Members use their account identity across devices; guests use a browser-local random identity. Clearing storage or using another browser can count a guest again. Admin Analytics computes visits and distinct visitors for the selected time period. Counts begin when these changes are enabled; there is no fabricated historical data.

Publish the additive rules before enabling visit collection. `firebase.json` selects the same named database as the checked-in Firebase app configuration:

```sh
npx firebase-tools deploy --only firestore:rules --project gen-lang-client-0026252792
```

This command requires authorized Firebase project access. Publishing the web build to Vercel alone does not publish Firestore rules.

## Verification

```sh
node --import tsx --test tests/game-integration.test.ts
npm run build
npx tsc --noEmit
```

The focused embedded-build patch script fails on unexpected upstream content, so future game imports cannot silently lose the integration. Do not run it on an already-patched build. It preserves existing audio assets and app PWA identity.

## Route continuity

The route in `scripts/lib/game-prompt-route.mjs` retains 42 districts, including earlier districts that were lost during route replacement. The original gate is part of the stadium, the library is in Azarita, and the citadel is in Bahary. Stanley, Gleem, San Stefano and the memorial use their original landmark models once per district per lap. Inland districts do not render sea scenery.

`game-route-continuity.mjs` restores scene dispatch and prevents generic street facades from obscuring Misr Station. Kom el Dikka has wider pavement to fit its cafe and food cart outside the running lanes. The Mex lighthouse has a wider black-and-white shaft.

Automated geometry, dispatch, route, audio and score tests cover these changes. Real mobile/WebGL visual verification remains outstanding; the available cloud browser cannot create a WebGL context.
