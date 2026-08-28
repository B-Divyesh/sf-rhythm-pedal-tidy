# Rhythm Pedal Tidy — repair handoff

## Independent verification baseline — historical failure

Verified on 2026-08-27 against candidate commit
`4c006ebd3d84d612cb7c4f31ea4c3efa51a58b5d` and
<https://rhythm-pedal-tidy.sociobot.in>. This addendum supersedes any prior
pass implication in this handoff.

The candidate artifact is deployed byte-for-byte, and clean install, unit,
build, Playwright, accessibility, core import/cleanup/export, offline reload,
and service-worker update-notice checks passed. **Do not release as passing:**

- **P2:** Start/Finish/Step tempo inputs accept invalid values into app state;
  for example, Start `29` produces BPM now `29` despite the stated 30 BPM
  minimum. Add validation/clamping and an announced recovery message.
- **P2:** production hashed JS and CSS use `cache-control: public,
  must-revalidate, max-age=30`, not immutable long-lived caching required for
  this static PWA. Fix the deployment cache policy for hashed assets.
- **P3:** production lacks CSP, Permissions-Policy, and a frame-embedding
  response policy.

Full fresh evidence and commands are in `.factory/verification-1.md`.

Date: 2026-08-27

Work order: `rhythm-pedal-tidy-build-1`

Deploy: static `./dist` (`index.html` at root)

## What was built

- A production Vite + vanilla TypeScript PWA with a cassette-era rehearsal
  zine interface and original generated risograph hero artwork.
- Standard MIDI type 0/1 parsing for tempo events, running status, note
  on/off, and sustain CC64 across tracks.
- A sustain-aware cleanup pass that expands physical releases to pedal-up,
  trims same-pitch overlaps at the next strike, and preserves starts and
  velocities.
- An explainable before/after piano roll with changed-note totals, removed
  duration, written rationale, and local acceptance tracking.
- Clean Standard MIDI export with sustain baked into note lengths, individual
  session JSON export/import, and all-takes JSON backup/restore.
- A replay synth, sixteenth-note timing score, early/late breakdown, and a
  start/finish/step tempo ramp that advances after completed playback.
- Plus live Web MIDI recording, device selection, one-time Sociobot license
  checkout/restore/verify, cached daily verdicts, and unlimited visible take
  history. Import, cleanup, accessibility, and data export remain free.
- IndexedDB persistence, an install manifest, 192/512/maskable icons, a
  versioned service worker that precaches hashed bundles, network-first
  navigation, cached assets, offline fallback, and update-ready UI.
- Responsive 390 px behavior, skip navigation, semantic landmarks, designed
  focus states, reduced-motion behavior, and `/privacy/` and `/terms/` pages.

## Run and verify

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

The factory build command is exactly `npm run build`; output is `./dist`.

Verified locally on 2026-08-27:

- `npm test`: 5/5 unit tests pass.
- `npm run build`: passes; `dist/index.html` exists.
- `npm run test:e2e`: 6/6 Chromium tests pass at 390 × 844, including an
  actual `context.setOffline(true)` reload after first PWA installation.
- Axe browser integration: zero serious or critical violations on the empty
  app, populated workbench, privacy page, and terms page.
- Browser console/page-error assertion: clean on load and after opening the
  example take.
- Lighthouse desktop run: Performance 100, Accessibility 100, Best Practices
  100, SEO 92; LCP 1.7 s, TBT 10 ms, CLS 0.
- Production output: initial JS 28.72 KB raw / 10.91 KB gzip; CSS 15.55 KB raw
  / 4.15 KB gzip. Mobile hero WebP is 52 KB, desktop AVIF is 76 KB.
- Manual visual review: 1440 × 1000 desktop and 390 × 844 mobile.

## Privacy and billing notes

There are no analytics, third-party fonts, runtime CDNs, or performance-data
requests. Takes stay in IndexedDB. The license token and last verification
verdict are the only localStorage values. Production uses
`https://api.sociobot.in/api/v1/products/rhythm-pedal-tidy/...`; non-production
hosts use the pilot API. No product ID or payment-provider embed is present.

## Historical known gaps / next steps

- Live Web MIDI needs a real keyboard/e-kit and browser permission, which were
  unavailable in the headless container. The permission, device, start/stop,
  hanging-note, and CC64 code paths are implemented; Safari users get the
  explicit `.mid` import fallback.
- SMPTE-timed MIDI is rejected with an actionable error. PPQ type 0/1 files
  are supported. SysEx and unrelated controller events are safely ignored.
- Timing scoring uses the file's initial BPM and a sixteenth-note grid; it is
  intentionally practice feedback, not groove or tempo-map analysis.
- The factory still needs to register the live/test billing product and switch
  the deployed environment according to its release process. No live purchase
  was performed during this build.

## Repair verification — PASS

Date: 2026-08-28
Work order: `rhythm-pedal-tidy-repair-1`
Base verifier report: `40b2887737f98dc1a24580ef0f31656e059f1be1` against
candidate `4c006ebd3d84d612cb7c4f31ea4c3efa51a58b5d`
Repair commits: `dec71c1` and `12b4b9f`
Deployment: <https://rhythm-pedal-tidy.sociobot.in> (Azure Static Web Apps,
production deployment `bc78a497-397f-4ff0-948f-0671e520f76a`)

This section supersedes the historical failure addendum above. All three
release-blocking findings in `.factory/verification-1.md` are repaired and
deployed; the original local-first MIDI import, pedal-aware cleanup,
comparison, replay, export, storage, free core path, paid live-MIDI unlock,
and cassette-zine visual system are unchanged.

| Verifier finding | Repair | Regression coverage / production evidence |
| --- | --- | --- |
| P2: Start/Finish/Step accepted invalid state | `src/tempo.ts` parses finite whole BPM values, clamps Start to 30–240, Finish to Start–300, and Step to 1–30. It restores a blank value and keeps current BPM inside the valid ramp. `#announcer` politely explains recovery. | `tests/tempo.test.ts` covers `29`, blank Step, and Finish below Start. The browser test enters Start `29`, blurs, and asserts Start and **BPM now** are `30` plus the announced message. This also passed on live desktop. |
| P2: hashed JS/CSS had 30-second revalidation | `public/staticwebapp.config.json` gives `/assets/*` `Cache-Control: public, max-age=31536000, immutable`. | `tests/deployment-config.test.ts` asserts the exact header. Live `HEAD` for `index-C0Kzvh_k.js` and `index-CZIQRJs5.css` returns it. |
| P3: response hardening missing | The same static configuration supplies restrictive CSP, `Permissions-Policy` (with `midi=(self)` retained), `X-Frame-Options: DENY`, nosniff, and referrer policy. | Configuration regression test and live `HEAD /` confirm CSP with `frame-ancestors 'none'`, Permissions-Policy, and X-Frame-Options. |

The service-worker cache revision is `rpt-v4` and the manifest start URL is
`/?v=2`, so installed copies discover this repair.

### Run and verify

```bash
npm ci
npm test
npm run build
npx playwright test
npm run preview
```

`npm run build` creates `./dist/index.html`; Vite copies the checked-in static
deployment configuration into `dist/`.

### Exact verification evidence

- Clean `npm ci` completed with **0 vulnerabilities**. Playwright and
  playwright-core are pinned to the factory-installed `1.58.2` so Axe and
  Playwright share compatible browser types.
- `npm test`: **9/9** pass (five MIDI, two tempo-validation, two
  static-response-policy tests). `npm run build` passes; initial JS is
  **30.02 kB raw / 11.38 kB gzip**, CSS **15.57 kB raw / 4.15 kB gzip**.
- `npx playwright test`: **7/7** Chromium tests pass: empty/populated Axe
  scans have zero serious/critical issues; console/page-error checks, legal
  pages, keyboard replay, invalid-tempo recovery, and an actual offline reload
  at **390 × 844** all pass. The offline page retains the take, banner, and
  MIDI export control.
- Final live `verify-url.sh` found title, `lang=en`, one h1, main landmark,
  image alt text, labelled buttons, and no console errors. Axe on live empty
  and populated desktop states at **1440 × 1000** had zero serious/critical
  issues. Live mobile at **390 × 844** started replay through the keyboard
  with no console errors.
- Installed-app update was tested against production: a browser controlled by
  live `rpt-v3` stayed open; after deployment and `registration.update()`,
  `rpt-v4` showed the in-app “A fresh version is ready” toast with no errors.
- Live response headers contain the CSP, Permissions-Policy,
  `X-Frame-Options: DENY`, nosniff, and referrer policy; final hashed JS and
  CSS return `public, max-age=31536000, immutable`.
- SHA-256 live identity comparisons matched `dist` for `/`, final JS/CSS,
  service worker, manifest, offline fallback, privacy page, and terms page.
- A normal live browser flow made requests only to
  `https://rhythm-pedal-tidy.sociobot.in`. There are no analytics, third-party
  fonts, or runtime CDNs; takes remain in IndexedDB and license verification
  stays user-triggered.
- Lighthouse mobile reached the audit phase but this container's tab crashed
  in Lighthouse's full-page-screenshot gatherer (`TARGET_CRASHED`); no score
  is claimed. Build budgets plus browser, Axe, console, responsive, keyboard,
  offline, update, privacy, identity, and response-policy checks passed.

### Remaining limitation

Live Web MIDI capture still requires physical MIDI hardware and a browser
permission prompt. The import fallback remains fully tested; no release
blockers are known.
