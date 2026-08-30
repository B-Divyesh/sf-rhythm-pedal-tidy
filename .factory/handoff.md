# Rhythm Pedal Tidy — release repair handoff

Date: 2026-08-30

Work order: `rhythm-pedal-tidy-repair-4`
Base verifier report: `.factory/verification-4.md` at candidate
`33518c4a8ff8eeca5eed48125961eac855617f8e`
Repaired application commits: `73b4d93e` and `30943ad2`
Production: <https://rhythm-pedal-tidy.sociobot.in>

## Result: repaired and deployed

All four verifier findings are fixed at their causes and have exact regression
coverage. The static PWA was deployed successfully (Azure deployment
`d2e057b0-11ac-4406-9ded-7f4cee5d62f3`), then verified against the live
custom domain.

### Verifier findings resolved

1. **Malformed backup data loss (P1):** `src/backup.ts` now validates and
   clones every backup/session record before `replaceAllTakes()` can run.
   Required fields include pedal events, notes, timing, MIDI ranges, source,
   and optional cleaned records. Malformed input reports that nothing changed;
   valid backup replacement is explicitly confirmed when saved takes exist.
   `tests/backup.test.ts` and the browser test use the verifier's exact
   missing-`pedals` payload. On production it preserved `Warm-up in C` before,
   after, and after reload, with no page errors.
2. **400 BPM invalid ramp (P2):** `tempoStateFromTakeBpm()` clamps an imported
   tempo to the rendered ramp contract before state/rendering/playback. The
   exact type-0 150,000 µs/quarter MIDI regression asserts Start **240**,
   Finish **300**, BPM now **240**, and two valid controls.
3. **Keyboard focus loss (P2):** rerenders restore the actionable logical
   control. Loading the example focuses the take heading, a Start-field Tab
   moves to Finish after the rerender, and Space replay keeps focus on its
   transport button. Deferred focus handles browser Tab navigation safely.
4. **Undersized mobile targets (P3):** header home, footer legal/source, and
   legal-page return links are now at least 44 px high. At 390 px production
   measurements are Home `152×44`, Privacy `80.7×44`, Terms `62.2×44`, Source
   `71.5×44`, and the legal return link `198.4×44`.

## Verification evidence

### Clean install, tests, and build

- `npm ci`: 96 packages installed; **0 vulnerabilities**.
- `npm test`: **14/14 passed** (MIDI, tempo, backup schema, deployment policy,
  and metadata).
- `npm run build`: TypeScript `--noEmit` passed and Vite produced `dist/`.
  Final initial JS is **33.89 kB raw / 12.66 kB gzip**; CSS is
  **15.85 kB raw / 4.20 kB gzip**; mobile hero WebP is **52.93 kB**.
- `npm run test:e2e`: **15/15 passed** in pinned Playwright 1.58.2. It covers
  the exact four repairs, desktop/mobile layout, keyboard, persistence,
  offline reload, service-worker first-install behavior, legal pages, Axe,
  and console errors. There is no separate lint script; TypeScript checking is
  part of `npm run build`.

### Browser, accessibility, privacy, offline, and update

- `/opt/fleet/lib/verify-url.sh` passed locally and live: HTTPS 200, no page or
  console errors, valid title/lang, exactly one h1, main landmark, no missing
  image alt text, and no unlabeled buttons.
- Axe on the deployed populated desktop and 390 px workspaces plus `/privacy/`
  and `/terms/`: **0 violations** on every scan.
- Manual desktop and 390 px checks found no document/main horizontal overflow.
  The repaired hit-area values are listed above.
- Normal live sample flow requested only
  `https://rhythm-pedal-tidy.sociobot.in`; no performance data leaves the
  browser. The only optional external product request remains explicit
  Sociobot license verification.
- Live PWA offline regression: after a service-worker-controlled sample load,
  offline reload retained `Warm-up in C`, the offline banner, and the cleaned
  MIDI export control.
- Controlled temporary-worker update: old `rpt-v4-shell` → current
  `rpt-v5-shell` displayed the update toast, with no page errors. First worker
  installation correctly leaves the toast hidden. The manifest start URL and
  precache are versioned at `?v=3`.
- Local mobile Lighthouse 12.8.2: **100 performance / 100 accessibility /
  100 best practices / 100 SEO**; FCP **0.9 s**, LCP **1.5 s**, TBT **20 ms**,
  CLS **0**.

### Deployment policy and live identity

- Live `/` headers include HSTS, CSP with `frame-ancestors 'none'`, MIDI-safe
  Permissions-Policy, `X-Frame-Options: DENY`, `nosniff`, and strict-origin
  referrer policy. Hashed assets are immutable for one year; HTML and worker
  revalidate after 30 seconds.
- `robots.txt`, `sitemap.xml`, and the canonical landing URL now ship, fixing
  the local crawler discovery audit; final Lighthouse SEO is 100.
- Local/live SHA-256 matches:
  - `index.html`: `cbe29ed4b0f7d407108900a4e0c91a99ba308134413bd895a0f52bb10050b2b4`
  - `assets/index-Loy3b5kK.js`: `a88c043ecc048c2888a70989c6060e81c9f5527f737b18fec4be27e358d630f6`
  - `assets/index-fGZ9JUhn.css`: `462463ddaf9d5663d2de1b3d8e3a151998bbc09bb9fb5e89be8c12b5fa111891`
  - `sw.js`: `29d78ca85fd9db3f5ffd0699e84be94244b688e56983f81ad3e523f4561eae8e`
  - `manifest.webmanifest`: `703a7e235630359532c0c09557195f440a7a9fe8df95baf7f3c35f1c66d55234`

## Run / reproduce

```bash
npm ci
npm test
npm run build
npm run test:e2e
```

## Known gaps

- Physical Web MIDI hardware and its browser permission prompt are unavailable
  in this headless container. The required `.mid` import fallback was exercised
  end to end, including cleanup, persistence, replay, and export.
- This is a static PWA, not a package, CLI, or backend; consumer-package,
  server concurrency, and backend health checks do not apply.

No known release blockers remain.
