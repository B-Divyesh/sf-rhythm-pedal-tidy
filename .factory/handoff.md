# Rhythm Pedal Tidy — polish 1 handoff

Date: 2026-08-30
Work order: `rhythm-pedal-tidy-polish-1`
Role: repair
Base review: `a59aca27b73c6b1ab3d01c382a0e2be86dffedf1`
Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: PASS

All six findings in `.factory/review-1.md` are repaired. The product keeps its
cassette-era rehearsal-zine identity and remains a local-first offline PWA.
The first screen still gives keyboard and e-kit players the one-click sample
path, while the sample remains separate from real takes.

## Changes

- Removed the decorative, unlisted artwork sentence from every shipped footer.
- Moved focus to the route H1 and announced the route on app entry, static
  pages, and browser Back restoration. Added a visible H1 focus treatment.
- Rewrote all four reviewed README passages in short plain language.
- Added regression tests for review-copy repairs and Demo/Back H1 focus.
- Bumped the PWA cache and build identity to `v1.0.2` / `rpt-v8` so updated
  legal and route scripts are available offline after refresh.
- Added a verb-first 80-character catalog description in
  `.factory/catalog-description.txt`.

The full finding-to-evidence table is in `.factory/polish-1.md`.

## Verification

Fresh clone: `/tmp/rpt-fresh-3ZXzfx/repo` at repair commit
`335c61a36218489b64d5e68e32d85aa6a6612b20`.

```bash
git clone --branch main /work/repo /tmp/rpt-fresh-3ZXzfx/repo
cd /tmp/rpt-fresh-3ZXzfx/repo
npm ci
npm test
# Every exact command from .factory/claims.json, separately
npm run test:e2e
npm run build
```

- `npm test`: 7 files, 24 tests passed.
- Every exact `@claim:` command in `.factory/claims.json` passed separately:
  demo isolation, pedal repair, MIDI import/input, timing, tempo, MIDI/JSON
  export, history, offline reload, local processing, and no checkout.
- Complete browser suite: 34 Playwright tests passed, including the dedicated
  offline browser context, request-origin privacy assertions, Axe checks,
  demo reset/isolation, legal routes, metadata, 404, keyboard, mobile,
  reduced-motion, malformed backup, and service-worker update paths.
- Production build passed. Initial JavaScript is 12.53 kB gzip; CSS is 4.46
  kB gzip. Both are within the static PWA budgets.
- `verify-url.sh` passed on cold live `/`, `/demo`, `/privacy/`, and `/terms/`:
  HTTPS 200, title, language, one H1, main landmark, image alt text, labelled
  controls, and zero console/page errors. Reports and screenshots are in
  `.factory/evidence/live-*`.
- Live Playwright/Axe check: zero serious/critical violations on `/`, `/demo`,
  `/privacy/`, `/terms/`, and `/404.html`; no console errors; only
  `https://rhythm-pedal-tidy.sociobot.in` requests. The unknown route returns
  the designed HTTP 404.
- Cold production `index.html` byte-matches `dist/index.html` at SHA-256
  `2a1e76a6091c2d60780f86f79d5eca767e1c5e4e016217420b4c74ed83cbcba8`.

## Deployment

Committed repair: `335c61a36218489b64d5e68e32d85aa6a6612b20`
Committed initial screenshots: `f75e40a`

Pushed `main` and deployed `dist/` using the configured static work-order
deployer. Azure deployment `c5a54fec-590d-4ad4-9a7c-79010c1bf6e4` completed
to the existing product static app, then the custom domain was cold-checked.

## Known gaps / next steps

None for this work order. Billing remains intentionally absent because the
factory product is not registered; this is the documented honest free-build
mode in `.factory/billing.md`, not a broken checkout.
