# Independent verification — FAIL

Date: 2026-08-28
Work order: `rhythm-pedal-tidy-verify-3`
Candidate: `7f20cb0f471e1a6be4b1b66ec43b976091794d8f`
Production: <https://rhythm-pedal-tidy.sociobot.in>

## Verdict

**FAIL.** Production is byte-identical to the candidate and the previous
keyboard-focus release blocker is fixed. The local-first MIDI repair flow
works. A new 390 px responsive defect remains release-blocking: the Plus
section is wider than the viewport and hidden overflow clips it.

## Defects

| Severity | Finding | Fresh evidence / user impact |
| --- | --- | --- |
| P2 | Plus content is clipped at the required 390 px mobile viewport. | At 390 x 844 after loading an example take, `.unlock-section` has `scrollWidth: 422` and its explanatory grid item is `left: 24`, `right: 422`, `width: 398`; `<main>` has `clientWidth: 390`, `scrollWidth: 422`, and `overflow-x: hidden`. The rightmost 32 px are not horizontally reachable. Visual review shows text ending mid-line and the right edge of the purchase panel/Verify button cut off. This fails the mobile end-to-end contract. `documentElement.scrollWidth <= innerWidth` is insufficient because overflow is hidden. |

Recommended repair: make the mobile Plus grid and its children shrink to the
available content width and avoid hidden overflow as containment. Add a 390 px
regression checking descendant right edges, then visually inspect the section.

## Evidence that passed

### Repository gates

- Checkout began clean at the exact candidate.
- `npm ci`: 96 packages, 0 vulnerabilities.
- `npm test`: **9/9** passed. There is no lint script; the exact build runs
  `tsc --noEmit`.
- `npm run build` passed and produced `dist/`: JS **30,038 B raw / 11.39 kB
  gzip**, CSS **15,658 B raw / 4.18 kB gzip**, and mobile hero WebP **52,926
  B**, all within budget.
- `npm run test:e2e`: **9/9** passed, including local Axe, offline, keyboard,
  focus-ring, tempo, persistence, desktop, and legal-page coverage.

### Real job flow and recovery

- Live **Try the example** gave 8 notes, 2 pedal presses, **3 overlaps**,
  **2.74 s** removed, score 92, and an explainable before/after diff.
  Acceptance persisted in IndexedDB after reload. Export produced a 105 B
  `warm-up-in-c-tidy.mid`.
- A separately constructed valid Standard MIDI type-0 CC64 passage imported
  as `pedal-repeat`, giving 2 notes, 1 pedal press, **1 clean cut**, and 0.50
  s removed. This covers repeated-pitch pedal cleanup independently of sample
  data.
- A non-MIDI file announced “That file is not a standard MIDI file (.mid).”;
  the example then loaded successfully. A 20 MiB + 1 B file announced “That
  file is over 20 MB. Split the take and try again.”
- Tempo recovery passed: Start 29 -> 30, Finish 301 -> 300, Step 31 -> 30,
  blank Step restored 30, each with a live explanation and no invalid current
  playback BPM.
- A physical Web MIDI device/prompt is unavailable in this container. The
  required Safari-compatible `.mid` import fallback was exercised end to end.

### PWA, accessibility, and performance

- Fresh live mobile (390 x 844) and desktop (1440 x 1000) checks had one h1,
  one main, `lang=en`, correct title, and no normal-path console/page errors.
- Fresh empty and populated 390 px Axe scans had **0 serious or critical**
  findings. The file input is no longer a Tab stop; the live Import focus ring
  is `3px #fffaf0` plus a `6px #171813` outer ring. Space starts/stops replay.
- Reduced-motion emulation yielded 0.01 ms transition/animation durations and
  `scroll-behavior: auto`.
- The live service worker controls the app. In an isolated profile, updating
  from a temporary old worker to candidate `/sw.js` showed “A fresh version is
  ready. Update now”. A controlled 390 px offline reload retained the take and
  MIDI export and displayed the Offline deck notice. The offline probe's
  deliberate `ERR_INTERNET_DISCONNECTED` is excluded from normal-path errors.
- Mobile Lighthouse: **Performance 100, Accessibility 100, Best Practices
  100, SEO 100**; FCP **1.0 s**, LCP **1.3 s**, TBT **0 ms**, CLS **0**.

### Privacy, deployment identity, and policies

- SHA-256 hashes for live `/`, `sw.js`, manifest, offline fallback, privacy,
  terms, and hashed JS/CSS exactly equal candidate `dist/`. JS is
  `1d1a947b0e3698a48328d3d955ae3c7b3c2eff657fa2e65d61d5f7bd41d6a404`;
  CSS is `48f9f646885d8bf8daea7bb25508a61f254799b67034158c0da0f0a60700bc26`.
- Normal live browsing requested only the product origin; no analytics,
  trackers, third-party fonts, or runtime CDNs were observed. Source review
  confirms takes use IndexedDB.
- A deliberately entered invalid license made exactly the user-triggered
  Sociobot verify GET, returned 200 with `Cache-Control: no-store`, and showed
  the invalid-license recovery. No performance MIDI is sent.
- Live responses have HSTS, CSP with `frame-ancestors 'none'`, nosniff,
  strict-origin referrer policy, `X-Frame-Options: DENY`, and MIDI-preserving
  Permissions-Policy. Hashed assets are immutable for one year; HTML and SW
  revalidate in 30 seconds for updates.

## Scope and reproduction

No product code was modified. This report and the handoff are the only QA
changes. This is a PWA, not a library/CLI/backend, so consumer-package, CLI,
concurrency, health, and server-persistence checks do not apply.

```bash
npm ci
npm test
npm run build
npm run test:e2e
CHROME_PATH=/opt/pw-browsers/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell \
  npx lighthouse https://rhythm-pedal-tidy.sociobot.in --quiet \
  --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
  --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile --screenEmulation.mobile
```
