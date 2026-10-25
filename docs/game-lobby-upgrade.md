# Local game lobby, wardrobe and coin shop

Status: source implementation with automated checks. Firebase rules publication and live mobile/account end-to-end verification remain outstanding.

The full-screen running engine, camera, controls, HUD, collisions, difficulty, score calculations and existing voices are retained. The menu uses the same live character rig and renderer, with a menu-only camera and idle poses. Coin snapshots add metadata events without changing running mechanics. The Misr Station exit now crosses the final station segment with a clear central arch.

The lobby provides character selection, wardrobe preview/save/reset, account balance, shop, leaderboard and audio/quality settings. Attachments follow the existing head, torso, leg and shin pivots. Each character has independent saved outfits. Islam El Far is a new procedural rig variant based on the supplied portrait: short dark hair, beard and blue clothing; likeness still needs visual review.

## Latest economy decision

Coins are spendable. `game_progress/{uid}` holds total credited coins; `game_cosmetics/{uid}.spentCoins` tracks purchases. Available balance is total minus spent. Neither field replaces or alters leaderboard score. Historical coins were not previously stored and are not fabricated from scores.

Each authenticated round gets a persistent `runs/{id}` ledger entry. Repeated or lower snapshots credit no extra coins. Increasing checkpoints credit only the difference in a Firestore transaction, using the same ledger across tabs/devices. Purchases update ownership and spending atomically: retries cannot charge an already owned item again and concurrent purchases retry against the latest balance. The shared catalog defines initial prices, which must stay aligned with `firestore.rules`.

Gamal is available initially. Initial character prices: Adel 250, Hamido 750, Lazo 1500, Islam 3000. Cosmetics: cap 100, glasses 300, shirt 600, shorts 1000, shoes 2000, Ittihad kit 4000, legendary kit 10000. Locked outfits may be previewed but cannot be equipped or saved before purchase. No payment or real money is involved.

## Validation and outstanding checks

Run `node --import tsx --test tests/game-integration.test.ts tests/game-score-api.test.ts tests/game-voices.test.ts tests/game-cosmetics.test.ts tests/game-coins.test.ts`, production build and TypeScript checking for application entrypoints. The full repository TypeScript check includes existing test-double Response typing errors; application entrypoint checking passes separately.

Outstanding before release: real mobile/WebGL rendering, likeness/accessory clipping review, live multi-device/account synchronization, and Firestore Rules emulator/authorized staging verification. The local environment has no runnable Chromium binary; downloading it failed. New persistence needs the included Firestore rules published when release is authorized. No claim of live authentication, balance or mobile end-to-end verification is made.

Coins, like existing game scores, originate in the client simulation. Rules enforce authenticated ownership, bounded values, atomic ledger deltas and exact catalog prices; they do not independently simulate runs or provide authoritative anti-cheat validation.

## Member gift and revised home navigation

Character selection is on the home screen next to the live showcase. There is one combined shop entry, labeled المتجر, for previewing and buying wearable items. The purchase confirmation button reads شراء.

`config/game-member-gift.json` freezes the existing-member cutoff. The administrative script `node scripts/grant-existing-member-gift.mjs` previews eligibility; adding `--apply` creates one immutable 3000-coin gift per qualifying member. Existing gift documents are skipped transactionally. Only an administrator can create gifts or change their amount. Members can acknowledge their own gift notification; acknowledging does not credit it again. The shop adds this trusted gift balance to earned coins and continues to subtract previous spending.

Gift migration was NOT applied: the runtime has no configured Firebase administrative credentials and its preview failed before reading membership. New rules and administrative migration must be run in an authorized Firebase environment. No current member balance has been changed by this local work.
