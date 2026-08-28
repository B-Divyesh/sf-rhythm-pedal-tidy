# Independent verification — FAIL

Date: 2026-08-28  
Work order: `rhythm-pedal-tidy-verify-2`  
Candidate commit: `415c0760b3947591ae50e0b303eaf1ffc47fa216`  
Production URL: <https://rhythm-pedal-tidy.sociobot.in>

## Verdict

**FAIL.** The candidate is deployed byte-for-byte, the earlier tempo, caching,
and response-policy failures are repaired, and the core local-first MIDI job
works. It still misses the non-negotiable keyboard-focus acceptance contract:
the universal focus indicator has insufficient contrast on the product's light
surfaces, and a clipped file input remains an invisible Tab stop.

## Release-blocking finding

| Severity | Finding | Fresh evidence / user impact |
| --- | --- | --- |
| P2 | Keyboard focus is not reliably visible. | On live mobile Chromium (390 x 844), the sixth Tab lands on `input#file-input`, labelled “Choose a MIDI or session file”. It has class `visually-hidden`, a clipped `1 x 44` px box, and `clip: rect(0px, 0px, 0px, 0px)`, so its computed 4 px focus outline cannot be seen. This creates an unexplained keyboard stop. Separately, every `:focus-visible` outline uses mustard `#e2ad38`; its contrast is only **1.75:1** against paper `#f3eddd`, **1.97:1** against tape `#fffaf0`, and **2.56:1** against a primary red button, below the required **3:1** UI/focus contrast. This violates the required visible, designed keyboard focus state even though Axe does not detect it. |

Recommended repair: remove the hidden file control from sequential Tab order
and activate it only from its labelled buttons, or give it a real visible
label/control. Use a focus color/ring treatment that reaches 3:1 against every
adjacent surface, then add a browser regression test which Tabs through the
import controls and checks the rendered focus indicator.

## What passed

### Clean checkout and repository gates

- The checkout began clean at exactly `415c0760b3947591ae50e0b303eaf1ffc47fa216`.
- `npm ci` completed: 96 packages installed, **0 vulnerabilities**.
- `npm test`: **9/9** tests passed (MIDI, tempo validation, and deployment
  policy tests).
- Exact production build, `npm run build`, passed and produced `dist/`.
  Initial JS was **30,024 B raw / 11.38 kB gzip**; CSS **15,570 B raw /
  4.15 kB gzip**; mobile hero WebP **52,926 B**. All are inside the stated
  static budgets.
- `npm run test:e2e`: **7/7** Chromium tests passed, including the repository
  Axe checks, console/page-error normal path, keyboard replay, tempo recovery,
  legal pages, persistence, and offline reload.

### End-to-end product checks

- Representative take: **Try the example** produced 8 notes, 2 pedal presses,
  **3 clean cuts suggested**, and 2.74 s removed. Acceptance survived reload
  in IndexedDB (`Accepted ✓`). Export generated `warm-up-in-c-tidy.mid`; the
  saved 105-byte file begins `4d 54 68 64` (`MThd`) and is Standard MIDI format
  0.
- A separate valid one-note Standard MIDI file imported as `SINGLE-NOTE`, with
  one note, no overlaps, and the announced result “MIDI imported. Cleanup
  suggestions are ready.”
- Invalid/recovery paths were exercised: malformed `bad.mid` announced “That
  file is not a standard MIDI file (.mid).”; a subsequent example take loaded
  normally. A 20 MiB + 1 B file announced “That file is over 20 MB. Split the
  take and try again.”
- Tempo boundaries recover before playback state changes: Finish `29` became
  the current Start (`100`), Finish `301` became `300`, Step `31` became `30`,
  and blank Step restored `30` with an announced explanation. The repository
  test separately confirms Start `29` becomes `30` and BPM now stays `30`.
- Invalid license restore made only the expected user-triggered request to
  `https://api.sociobot.in/api/v1/products/rhythm-pedal-tidy/verify?...`, then
  showed “License no longer active.” and “That license could not be verified.”
  No payment flow was invoked.
- A real MIDI device/permission prompt was not available in this headless
  container. The Safari-compatible import fallback, which is the brief's
  required fallback, was exercised end to end.

### PWA, responsive, accessibility, and performance checks

- On the live URL, a fresh 390 x 844 context loaded a sample take, waited for
  service-worker control, went offline, and reloaded with the take, **Offline
  deck** message, and MIDI export still available. The expected offline network
  failure was logged by Chromium only after offline was deliberately enabled;
  the normal online path had no console or page errors.
- A controlled local update check registered an old temporary worker, then the
  candidate `sw.js`; `registration.update()` displayed the in-app **“A fresh
  version is ready.”** toast. Candidate source was not changed.
- Desktop 1440 x 1000 and mobile 390 x 844 visual reviews show no horizontal
  overflow and preserve the intended stacked mobile workbench. Keyboard Space
  starts/stops replay. Reduced-motion emulation yields `0.01 ms` transition and
  animation durations and `scroll-behavior: auto`.
- Fresh Axe scans of empty and populated live workspace at both viewport sizes,
  plus the local legal-page suite, had **0 serious or critical** violations.
  The live page has `lang=en`, one h1, one main landmark, title, alt text, and
  normal-path console/page errors were empty. The P2 above is manual focus and
  contrast evidence beyond Axe's coverage.
- Mobile Lighthouse 12.8.2 against production: **Performance 98,
  Accessibility 100, Best Practices 100, SEO 100**; LCP **1.3 s**, TBT
  **180 ms**, CLS **0**.

### Privacy, deployment identity, and response policies

- A normal live browser session requested only
  `https://rhythm-pedal-tidy.sociobot.in`; source inspection and observed
  behavior show no analytics, trackers, third-party fonts, or runtime CDNs.
  Takes use IndexedDB. The only designed external request is user-triggered
  Sociobot license verification; performance MIDI is not sent there.
- SHA-256 values for live `/`, hashed JS/CSS, `/sw.js`, manifest, offline
  fallback, privacy, and terms exactly matched this candidate's `dist/`.
- Live document and assets have HSTS, nosniff, strict referrer policy, CSP with
  `frame-ancestors 'none'`, `Permissions-Policy` retaining same-origin MIDI,
  and `X-Frame-Options: DENY`. Both hashed bundles return
  `Cache-Control: public, max-age=31536000, immutable`.

## Scope and commands

No product code was modified. Verification-only documentation is the sole
working-tree change. Reproduce baseline gates with:

```bash
npm ci
npm test
npm run build
npm run test:e2e
```

The product is a browser PWA, not a library/CLI or backend, so package-consumer,
backend concurrency, persistence-service, and health/build-identity checks do
not apply.
