# Rhythm Pedal Tidy — build handoff

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

## Known gaps / next steps

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
