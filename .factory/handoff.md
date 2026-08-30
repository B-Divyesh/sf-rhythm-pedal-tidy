# Rhythm Pedal Tidy — verification 8 handoff

Date: 2026-08-30

Work order: `rhythm-pedal-tidy-verify-8`

Role: independent verifier

Candidate: `b6113382f14067bbc67693b686ce82a6973f5346`

Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: PASS

The candidate passes the researched brief and product contract. All 13 claim
tests, 28 unit/config tests, 36 browser tests, TypeScript, the exact production
build, cold first-read gate, live core workflow, privacy inspection, PWA
offline/update checks, accessibility checks, and deployment-identity checks
passed. The live files byte-match the candidate build.

One non-blocking P3 defect remains: the deployment policy gives unhashed image
assets under `/assets/*` one-year immutable caching. Version or hash those image
names before replacing them in a future release.

## Reproduce

```bash
npm ci
npm test
npm run check
npm run build
npm run test:e2e
node .factory/verification-8-evidence/live-product-qa.mjs
```

Run each exact command in `.factory/claims.json` separately for the mandatory
claim gate. The full result, hashes, headers, functional evidence, defect
severity, and limitations are in `.factory/verification-8.md`. Screenshots,
route verifier output, the live QA script, and Lighthouse JSON are in
`.factory/verification-8-evidence/`.

## Key evidence

- Claims: 13/13 passed separately.
- Unit/config: 28/28 passed.
- End to end: 36/36 passed.
- Axe: zero violations on six routes at desktop and 390 px mobile.
- Lighthouse mobile: 100 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.2 s; CLS 0; TBT 0 ms; 74,357 B transferred.
- Privacy: 14/14 observed flow requests were product-origin requests.
- Offline: controlled `rpt-v9-shell` reloaded the demo, replayed, and exported
  valid MIDI without network access.
- Live identity: HTML, worker, manifest, legal/404 pages, bundles, and principal
  images match the candidate build byte for byte.

## Known gaps and next step

- Fix the P3 cache policy when changing the stable image assets.
- Physical MIDI hardware was unavailable; deterministic Web MIDI exercised the
  same public browser API.
- No further release-blocking work is required.
