# Polish 2 — cumulative repair map

Date: 2026-08-30

Work order: `rhythm-pedal-tidy-polish-2`

Code repair commit: `bfd926f`
Live URL: <https://rhythm-pedal-tidy.sociobot.in>

Every finding from review 1 and review 2 was rechecked. Review 1 remains
closed, and review 2 is closed with the changes and evidence below.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept artwork provenance out of every public footer. Provenance remains only in `.factory/design.md`. | `tests/polish.test.ts` — `removes the decorative artwork claim from every public footer`; live URL verifier reports are under `.factory/evidence/polish-2/live-*/verify.json`. |
| F-1-2 | Kept route H1 focus and polite announcements. Both the compact demo H1 and landing H1 use the same route-focus target. | `tests/e2e/app.spec.ts` — `route navigation and browser history focus and announce the route heading`; cold live check: Demo focus `true`, Back focus `true`, announcements correct. |
| F-1-3 | Kept the README workflow split into two short sentences. | `tests/polish.test.ts` — approved README wording; `.factory/copy-audit.md` records 6 and 13 words. |
| F-1-4 | Kept Reset demo and Start for real as separate README sentences. | `tests/polish.test.ts`; `.factory/copy-audit.md` records 5 and 12 words. |
| F-1-5 | Kept the repair explanation in plain sustain-pedal language. | `tests/polish.test.ts`; README sentence audit records 17 and 5 words. |
| F-1-6 | Kept storage implementation details out of README. | `tests/polish.test.ts` rejects the demo namespace in README; exact namespaces remain in `.factory/demo.md` and Privacy. |
| F-2-1 | The landing action now opens `/?demo=1`. Demo mode omits the marketing hero and renders **Warm-up in C**, four repair totals, the before/after roll, and **Accept cleanup** in the initial 390×844 viewport. The banner remains persistent. | `tests/e2e/app.spec.ts` — `one click opens the in-use sample and its first decision inside the 390 by 844 viewport`; screenshot `.factory/evidence/polish-2/live-demo-query/screenshot-mobile.png`; live: <https://rhythm-pedal-tidy.sociobot.in/?demo=1>. |
| F-2-2 | Added the `tempo-control-ranges` claim. Its browser test checks each lower and upper boundary plus a value beyond each boundary for Start, Finish, and Step. | `.factory/claims.json`; `tests/e2e/app.spec.ts` — `@claim:tempo-control-ranges enforces every published tempo boundary`; its exact command passed in the clean clone. |
| F-2-3 | Removed “Playback is a simple synth preview.” The replay action remains clearly labeled without making an extra output claim. | `tests/polish.test.ts` — `removes every reviewed jargon, metaphor, and unlisted preview sentence`; live copy scan found the sentence absent. |
| F-2-4 | Replaced “CC64” in the empty-state guidance with “the sustain pedal.” | `tests/polish.test.ts`; cold live copy scan of `/` found no “CC64”. |
| F-2-5 | Replaced visitor-facing “session” with “take” in import/export controls, file labels, validation errors, README, demo docs, and claims. | `tests/polish.test.ts` — canonical terminology test; `@claim:json-data-roundtrip` exports and restores one take and all takes. |
| F-2-6 | Replaced “SIDE A / READY” with the literal state “No take loaded.” | `tests/polish.test.ts` rejects the old label; live landing screenshot: `.factory/evidence/polish-2/live-root/screenshot-mobile.png`. |
| F-2-7 | Replaced “Take shelf” with “Saved takes” in the app, README, Privacy, claims, and technical comments. | `tests/polish.test.ts` — canonical terminology test; live `/` and `/privacy/` URL checks passed. |
| F-2-8 | Replaced “tangle removed” with “overlap removed.” | `tests/polish.test.ts`; live demo shows “2.74s overlap removed.” |
| F-2-9 | Replaced “Ready for your DAW” with “Export the cleaned take.” | `tests/polish.test.ts`; `@claim:midi-export` verifies the resulting Standard MIDI download. |
| F-2-10 | Replaced “Cleanup accepted. Nice take.” with “Cleanup accepted and saved with this take.” | `tests/polish.test.ts`; `@claim:local-processing` asserts the exact confirmation while recording same-origin requests. |

## Cumulative evidence

- Clean clone: `/tmp/tmp.meCmlaxNmh/repo` at `84c7bcb`; `npm ci`
  completed with zero vulnerabilities.
- Every one of the 13 exact commands in `.factory/claims.json` passed
  separately from that clone.
- Local `npm test`: 28 tests passed. Local `npm run test:e2e`: 36 browser
  tests passed, including privacy, offline, mobile, keyboard, routing, and Axe.
- Production build: 34.59 kB JavaScript and 19.38 kB CSS before gzip; 12.64 kB
  JavaScript and 4.87 kB CSS gzip.
- Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.243 s, CLS 0, total blocking time 0 ms.
- Live Axe: zero violations on `/` and `/?demo=1`; zero serious or critical
  violations on Privacy, Terms, and 404.
- Deployment `e2cf434f-b061-436b-a4f1-0d7897ef7c1b` succeeded. Local and
  live `index.html` share SHA-256
  `81328d9bca5858f127dc3d205f96e006c98f1f8671e22267e331eaf6295345fc`.
- Cold live checks found only same-origin requests, no console errors, working
  offline demo reload, correct titles/focus, and a designed HTTP 404 response.

No review finding remains open.
