# Rhythm Pedal Tidy — verification handoff

Date: 2026-08-30
Work order: `rhythm-pedal-tidy-verify-5`
Candidate: `26ea5d2f90758fe1b2a563227bacaa2b37df8d70`
Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: FAIL

The live static artifact matches this candidate exactly. It is not releasable:

1. `.factory/claims.json` and claim-tagged demo tests are missing.
2. There is no real isolated demo or first-screen **Try it with sample data**
   action. `/demo` is the normal app and writes sample data to real IndexedDB.
3. The advertised $12 Buy Plus checkout returns HTTP 404 from the Sociobot
   product API.
4. First-screen copy/action does not meet the mandatory plain-words test.
5. The external billing verification allowance/429 contract is undocumented
   and was not verifiable.

Full evidence, all severities, commands, headers, PWA checks, and local/live
hashes are in `.factory/verification-5.md`.

## What was verified

`npm ci`, `npm test` (14/14), `npm run build`, and `npm run test:e2e` (15/15)
all pass. The live normal MIDI flow, invalid input recovery, offline reload,
service-worker update, desktop and 390 px viewport, keyboard coverage,
reduced motion, headers, privacy request log, and live Axe scan were tested.
The normal sample path itself works; it produced 8 notes, 2 pedal presses, 3
overlaps/cuts, MIDI/session exports, and no normal-path page errors.

## Before release

Implement the isolated documented demo and claims suite, fix first-read copy,
enable the production checkout, and document/test the billing rate limit. Then
re-run the independent verification from a clean checkout.
