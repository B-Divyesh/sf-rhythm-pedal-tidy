# Polish 3 — cumulative repair map

Date: 2026-08-30
Work order: `rhythm-pedal-tidy-polish-3`
Repair code commit: `478179da1228796f126da5938f9c3a092bde38e0`
Live: <https://rhythm-pedal-tidy.sociobot.in>

All earlier review, polish, and verification files were read. The first two
rounds remained fixed; the seven round-3 defects were repaired and deployed.
Each screenshot path below is from a cold live URL verifier run.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept artwork-provenance language out of every public footer. | `tests/polish.test.ts` — `removes the decorative artwork claim from every public footer`; screenshot `.factory/evidence/polish-3/live-root/screenshot-desktop.png`; live `/` has no artwork claim. |
| F-1-2 | Preserved H1 focus and polite route announcements on landing, demo, history, and static routes. | `tests/e2e/app.spec.ts` — `route navigation and browser history focus and announce the route heading`; screenshot `.factory/evidence/polish-3/live-demo-route/screenshot-mobile.png`; live `/demo` focuses `#page-title`. |
| F-1-3 | Preserved the short README workflow sentences. | `tests/polish.test.ts` — `uses the approved short README wording`; `.factory/copy-audit.md`; repository-only documentation check in the clean clone. |
| F-1-4 | Preserved distinct short README Reset demo and Start for real sentences. | `tests/polish.test.ts` — `uses the approved short README wording`; `.factory/copy-audit.md`; repository-only documentation check in the clean clone. |
| F-1-5 | Preserved plain sustain-pedal README wording without CC64 jargon. | `tests/polish.test.ts` — `uses the approved short README wording`; `.factory/copy-audit.md`; repository-only documentation check in the clean clone. |
| F-1-6 | Preserved the non-technical README demo explanation; implementation namespace remains in technical docs only. | `tests/polish.test.ts` rejects `demo:rhythm-pedal-tidy` in README; `.factory/copy-audit.md`; repository-only documentation check in the clean clone. |
| F-2-1 | Preserved one-click `?demo=1` isolation and an immediately in-use sample viewport with banner/reset/exit. | `tests/e2e/app.spec.ts` — `one click opens the in-use sample and its first decision inside the 390 by 844 viewport`; `.factory/evidence/polish-3/live-demo-query/screenshot-mobile.png`; live `/?demo=1`. |
| F-2-2 | Preserved the `tempo-control-ranges` claim and all published boundary validation. | `@claim:tempo-control-ranges`; `.factory/evidence/polish-3/live-demo-query/screenshot-desktop.png`; live `/?demo=1` shows the exact range guidance. |
| F-2-3 | Kept the untested synth-preview promise removed. | `tests/polish.test.ts` — `removes every reviewed jargon, metaphor, and unlisted preview sentence`; `.factory/evidence/polish-3/live-demo-query/screenshot-mobile.png`; live `/?demo=1` has no preview-source claim. |
| F-2-4 | Kept `sustain pedal` in the empty state instead of CC64. | `tests/polish.test.ts` — `removes every reviewed jargon...`; `.factory/evidence/polish-3/live-root/screenshot-desktop.png`; live `/`. |
| F-2-5 | Kept `take` and `saved takes` as the visitor-facing terms. | `tests/polish.test.ts` — `uses the canonical take... terms`; `.factory/evidence/polish-3/live-root/screenshot-desktop.png`; live `/`. |
| F-2-6 | Kept the literal `No take loaded` state. | `tests/polish.test.ts` — `removes every reviewed jargon...`; `.factory/evidence/polish-3/live-root/screenshot-mobile.png`; live `/`. |
| F-2-7 | Kept the literal `Saved takes` heading. | `tests/polish.test.ts` — `uses the canonical take... terms`; `.factory/evidence/polish-3/live-root/screenshot-desktop.png`; live `/`. |
| F-2-8 | Kept the measured `overlap removed` result label. | `tests/polish.test.ts` — `uses the canonical take... terms`; `.factory/evidence/polish-3/live-demo-query/screenshot-mobile.png`; live `/?demo=1`. |
| F-2-9 | Kept the concrete export heading. | `tests/polish.test.ts` — `uses the canonical take... terms`; `.factory/evidence/polish-3/live-demo-query/screenshot-mobile.png`; live `/?demo=1`. |
| F-2-10 | Kept the persistence-focused cleanup acceptance message. | `@claim:local-processing`; `.factory/evidence/polish-3/live-demo-query/screenshot-desktop.png`; live `/?demo=1`. |
| F-3-1 | Renamed all five `/assets` images with SHA-256-derived content fragments; immutable cache routes now name only those exact files. | `tests/deployment-config.test.ts` — `ships immutable caching only for content-hashed image assets`; `.factory/evidence/polish-3/live-root/screenshot-desktop.png`; live hashed AVIF gives `200` + immutable cache, retired stable AVIF gives non-immutable `404`. |
| F-3-2 | Replaced `pedal-up` with `extended while the sustain pedal was held`. | `tests/polish.test.ts` — `uses literal sustain and export explanations...`; `.factory/evidence/polish-3/live-demo-query/screenshot-mobile.png`; live `/?demo=1`. |
| F-3-3 | Replaced `baked into` with `The cleaned note lengths include the sustain-pedal holds.` | `tests/polish.test.ts` — `uses literal sustain and export explanations...`; `.factory/evidence/polish-3/live-demo-query/screenshot-mobile.png`; live `/?demo=1`. |
| F-3-4 | Replaced the 404 tape lore with `404 / PAGE NOT FOUND`. | `tests/e2e/app.spec.ts` — `route metadata, common footer identity, and the designed 404 are complete`; `.factory/evidence/polish-3/live-404/screenshot-mobile.png`; live `/404.html`. |
| F-3-5 | Renamed footer and legal repository links to explicitly name GitHub, including offline fallback. | `tests/polish.test.ts` — `names GitHub before every product external repository link`; `.factory/evidence/polish-3/live-privacy/screenshot-desktop.png` and `live-terms/screenshot-desktop.png`; live `/privacy/`, `/terms/`, `/404.html`, and `/`. |
| F-3-6 | Added static-host `.avif` MIME configuration. | `tests/deployment-config.test.ts` — `declares the AVIF response type for the static host`; `.factory/evidence/polish-3/live-root/screenshot-desktop.png`; live hero AVIF header is `Content-Type: image/avif`. |
| F-3-7 | Skip the online probe when `navigator.onLine` is false and assert no errors during offline reload. | `@claim:offline-reload` now captures console/page errors; `.factory/evidence/polish-3/live-demo-route/screenshot-mobile.png`; live cached `/demo` offline reload passed with zero console errors. |

## Final evidence

- Clean-clone claims: all 13 exact `.factory/claims.json` commands passed
  separately. `npm test` passed 32 tests; `npm run check` passed; `npm run
  test:e2e` passed 36 browser tests.
- Live verifier reports are in `.factory/evidence/polish-3/live-*/verify.json`.
  They report one H1, main, language, labelled controls, alt text, and zero
  console errors.
- Live Playwright Axe: 0 violations on six routes at 1440×900 and 390×844.
- Live Lighthouse report: `.factory/evidence/polish-3/lighthouse-live.json` —
  Performance 100, Accessibility 100, Best Practices 100, SEO 100.

No finding remains open.
