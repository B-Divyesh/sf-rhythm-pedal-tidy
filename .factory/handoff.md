# Rhythm Pedal Tidy — repair handoff

Date: 2026-08-28
Work order: `rhythm-pedal-tidy-repair-3`
Verifier report: `.factory/verification-3.md`
Verifier candidate: `7f20cb0f471e1a6be4b1b66ec43b976091794d8f`
Repaired product commit: `7767e6a8985f329b7aeca90e5ad2a3c11344225c`
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
  0 ms, CLS 0. Production's static-host response configuration scores 100 for
  SEO as recorded below.

## Privacy and remaining limitation

There are no analytics, third-party fonts, runtime CDNs, or performance-data
uploads. Takes stay on-device; the only remote request is an explicit Sociobot
license verification. Physical Web MIDI device capture still requires MIDI
hardware and a browser permission prompt; the Safari-compatible `.mid` import
fallback is covered end to end.

## Post-deploy evidence

- Azure Static Web Apps deployment `bbd6b89c-5d56-47a2-849d-777ab51e0822`
  completed successfully. `verify-url.sh` returned HTTPS 200 in 891 ms with
  the expected title, `lang=en`, one h1, main landmark, image alt text, and no
  browser errors.
- Live SHA-256 comparisons exactly match `dist/`: `index.html`
  `4bbc24b9defaf214f35c68c2c5bcb7b2934f19a524af667316c91fbea4079cb5`,
  `sw.js` `bb498725260d160a5665e3b434e6f3980f5fc7871251c9a43780f1ca62417b6f`,
  app JS `1be08276f81859101f50fad70a1159f1803469198f0aefa41a188e10f907a810`,
  and CSS `cf14750cde6ed0f1940c45e24ccdbea5bf373dd32e4a2d11f54e83444178ecc5`.
- Live `/` supplies HSTS, CSP including `frame-ancestors 'none'`, a
  MIDI-preserving Permissions-Policy, `X-Frame-Options: DENY`, nosniff, and
  the strict-origin referrer policy. Normal live browsing made requests only
  to `https://rhythm-pedal-tidy.sociobot.in`, with no console/page errors.
- Fresh live 390 × 844 verification after loading the example: Plus
  `clientWidth: 390`, `scrollWidth: 390`; main `scrollWidth: 390` and
  `overflow-x: visible`; all Plus descendant rectangles remain in bounds. A
  service worker controlled the app; an offline reload retained the Offline
  deck notice and Export cleaned MIDI control.
- A controlled local old-worker-to-current-worker update showed the in-app
  “A fresh version is ready.” toast and created the current `rpt-v4-shell`
  cache, confirming the update path without changing the shipped source.
- Production mobile Lighthouse: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, TBT 10 ms, CLS 0.
