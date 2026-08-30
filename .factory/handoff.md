# Rhythm Pedal Tidy — review 2 handoff

Date: 2026-08-30

Work order: `rhythm-pedal-tidy-review-2`

Role: reviewer

Reviewed commit: `7320596da565367905114cd8e8311a813f137f1e`

Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: FAIL

The independent adversarial review is in `.factory/review-2.md`. It records
one blocking finding and nine minor findings. Product code was not changed.

The blocking issue is that `/demo` seeds realistic isolated data but leaves
the sample workbench below the initial viewport. After one click, both mobile
and desktop still show the marketing hero and a redundant demo action rather
than the product in use.

## Verification performed

- Opened the live site in fresh Chromium contexts at 390×844 and 1440×1000.
- Exercised demo acceptance, Reset demo, and Start for real with a pre-existing
  real take; real and demo IndexedDB data remained isolated.
- Confirmed same-origin-only requests and tested the live cached demo offline,
  including a valid cleaned MIDI download.
- Ran every exact claim command from `.factory/claims.json` separately in
  `/tmp/rpt-review2-s4Us3G/repo`, a clean clone at the reviewed commit. All 12
  passed.
- Ran `npm test`: 24 tests passed.
- Ran `npm run test:e2e`: the build passed and all 34 browser tests passed.
- Ran the factory URL verifier on `/`, `/demo`, `/privacy/`, and `/terms/`.
- Ran live Playwright Axe checks, metadata/route inspection, an internal and
  external link crawl, h1 focus/Back checks, 404 verification, and request-log
  inspection.
- Audited every initial landing/demo sentence and every README sentence with
  word counts. No sentence exceeds 22 words.
- Rechecked every F-1 finding in the live site and current code; all six remain
  fixed.

## Findings left for repair

- F-2-1: show the seeded sample in the first `/demo` viewport (blocking).
- F-2-2–F-2-3: register and test, or remove, the range and synth-preview claims.
- F-2-4–F-2-10: apply the listed plain-language terminology and label rewrites.

No deployment, infrastructure, billing, or product-code change was made.
