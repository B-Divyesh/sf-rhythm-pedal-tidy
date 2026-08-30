# Rhythm Pedal Tidy — verification handoff

Date: 2026-08-30

Work order: `rhythm-pedal-tidy-verify-6`

Requested candidate: `7ffb4b2ddb66be7ce556befaac9625cb65d0c63c`

Available head tested: `7ffb4b772d8266a444568d6d18bba931749e1292`

Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: FAIL

Do not release this candidate. The requested commit is absent from both the
clone and remote, every exact claim command fails from a clean installed clone
until an undocumented build step is run, the 1280×720 first screen clips the
sample action below the fold, public promises are missing from the claims
inventory, and end-of-take held-pedal input is not repaired correctly.

Full evidence, passing checks, hashes, and reproduction steps are in
[verification-6.md](verification-6.md).

## Verification summary

- Requested commit fetch: **FAIL** — remote says `not our ref`; current remote
  `main` is `7ffb4b772d8266a444568d6d18bba931749e1292`.
- Clean claim commands after `npm ci`: **FAIL 6/6** because `dist/` is absent.
- Same claim commands after `npm run build`: **PASS 6/6**.
- `npm ci`: **PASS**, 0 vulnerabilities.
- `npm test`: **PASS**, 15/15.
- `npm run check`: **PASS**.
- `npm run build`: **PASS**, `dist/` produced.
- `npm run test:e2e`: **PASS**, 23/23 after build.
- Live Playwright Axe: **PASS**, zero serious/critical findings on root, demo,
  privacy, and terms.
- Live mobile Lighthouse: **100 / 100 / 100 / 100**; LCP 1.3 s, TBT 0 ms,
  CLS 0.
- Live privacy log: **PASS**, same-origin requests only for the tested flow.
- PWA manifest/installability, worker update regression, and offline demo
  reload: **PASS**.
- Live deployment matches the production build of available `main` by SHA-256,
  but cannot be matched to the unavailable requested candidate.

## Defects by severity

- **P1:** requested candidate object unavailable; identity cannot be attested.
- **P1:** clean-clone claim commands fail unless `dist/` is built manually.
- **P1:** sample action and next-step explanation are clipped at 1280×720.
- **P1:** no-pedal-up takes lose sustain and report no repeated-note overlap.
- **P1:** multiple public promises have no claims entries/tests.
- **P2:** unknown routes return the normal app with HTTP 200; no real 404.
- **P2:** Open Graph/Twitter, per-route canonical data, standard footer/build
  identity, and 44 px desktop nav targets are missing.
- **P3:** Web MIDI permission denial does not state the import fallback.

No product code was modified. Only this handoff and the independent
verification report were added/updated.
