# Rhythm Pedal Tidy — repair handoff

Date: 2026-08-28
Work order: `rhythm-pedal-tidy-repair-3`
Verifier report: `.factory/verification-3.md`
Verifier candidate: `7f20cb0f471e1a6be4b1b66ec43b976091794d8f`
Deployment: <https://rhythm-pedal-tidy.sociobot.in>

## Result

The independent verifier's sole P2 release blocker is repaired. The original
local-first MIDI import, pedal-aware cleanup, comparison, replay, export,
IndexedDB persistence, offline shell, free path, and optional Plus Web MIDI
behavior are unchanged.

| Verifier finding | Root cause and repair | Exact regression coverage |
| --- | --- | --- |
| At 390 px, the Plus section grew to 422 px while `<main>` hid the extra 32 px, clipping the explanatory copy and purchase panel. | CSS Grid's automatic minimum track size honored the explanatory grid item's 398 px intrinsic width. Plus tracks now use `minmax(0, ...)`, direct Plus children use `min-width: 0`, and the global hidden-overflow mask was removed from `<main>`. | The 390 × 844 Playwright test loads an example take, checks Plus `scrollWidth <= clientWidth`, checks that `<main>` is not hiding overflow, and checks the bounding rectangle of every Plus descendant against the section's left/right edges. The pre-repair candidate produced the verifier's `right: 422` failure; the repair yields a 390 px section/scroll width and no out-of-bounds descendant. |

## Run and verify

```bash
npm ci
npm test
npm run build
npm run test:e2e
npm run preview
```

`npm run build` writes the static PWA to `./dist` with `index.html` at its
root. Deploy `dist/` with:

```bash
/opt/fleet/lib/deploy-static.sh rhythm-pedal-tidy dist
```

## Evidence

- Clean `npm ci`: 96 packages installed; 0 vulnerabilities.
- `npm test`: 9/9 passed (MIDI cleanup, tempo validation, and deployment
  response-policy configuration).
- `npm run build`: TypeScript and Vite passed. The initial JS is 30.04 kB raw
  / 11.39 kB gzip and CSS is 15.72 kB raw / 4.19 kB gzip, both inside the
  static budget; `dist/index.html` exists.
- `npm run test:e2e`: 10/10 Chromium tests passed. Coverage includes empty and
  populated Axe scans with zero serious/critical issues, console/page-error
  checks, legal pages, 390 px persistence plus explicit offline reload,
  keyboard replay, keyboard focus, tempo recovery, the new Plus geometry
  regression, and 1440 × 1000 desktop layout.
- Direct 390 × 844 post-repair browser measurement after loading the example:
  Plus `clientWidth: 390`, `scrollWidth: 390`; main `clientWidth: 390`,
  `scrollWidth: 390`, `overflow-x: visible`; no Plus descendant has an edge
  outside its section.
- A local normal-path browser run made requests only to `127.0.0.1`, found no
  console or page errors, retained accepted work across reload, and confirmed
  `lang=en`, one title, one h1, one main landmark, and no desktop horizontal
  overflow. MIDI performance data remains in IndexedDB; Sociobot verification
  remains an explicit license action.
- Mobile Lighthouse against the production build preview: Performance 100,
  Accessibility 100, Best Practices 100, SEO 92; FCP 1.0 s, LCP 1.6 s, TBT
  0 ms, CLS 0. The existing static-host SEO configuration is unchanged.
- The production post-deploy identity, response-header, offline/service-worker
  control/update, and live URL checks are recorded below after deployment.

## Privacy and remaining limitation

There are no analytics, third-party fonts, runtime CDNs, or performance-data
uploads. Takes stay on-device; the only remote request is an explicit Sociobot
license verification. Physical Web MIDI device capture still requires MIDI
hardware and a browser permission prompt; the Safari-compatible `.mid` import
fallback is covered end to end.

## Post-deploy evidence

Pending deployment from this repair work order.
