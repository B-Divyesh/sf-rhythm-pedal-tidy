# Polish 1 — review repair map

Date: 2026-08-30  
Work order: `rhythm-pedal-tidy-polish-1`  
Repair commit: `335c61a36218489b64d5e68e32d85aa6a6612b20`  
Evidence commit: `f75e40a`

The review found six minor issues. All are closed below. Earlier review/polish
files do not exist. The earlier verification findings remain covered by the
clean-clone claim run and complete browser suite listed in the handoff.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Removed “Original AI-assisted risograph artwork.” from the app, privacy, terms, 404, and offline footers. Artwork provenance remains in the maintainer-only design record. Removed the now-inaccurate footer location from `local-processing` in `claims.json`. | `tests/polish.test.ts` — `removes the decorative artwork claim from every public footer`; live browser audit reported `decorativeFooter: 0` for `/`, `/demo`, `/privacy/`, `/terms/`, and `/404.html`; screenshot: `.factory/evidence/live-root/screenshot-desktop.png`; live: <https://rhythm-pedal-tidy.sociobot.in/>. |
| F-1-2 | Added a temporary `tabindex="-1"` to each route H1, focused it after app route entry and browser-history restoration, and added a polite route announcer. Static legal, 404, and offline pages use the same local route-focus script. | `tests/e2e/app.spec.ts` — `route navigation and browser history focus and announce the route heading`; live audit reported `demoFocus: true`, `backFocus: true`, and `Demo route loaded.`; screenshot: `.factory/evidence/live-demo/screenshot-mobile.png`; live: <https://rhythm-pedal-tidy.sociobot.in/demo>. |
| F-1-3 | Split the README opening workflow into “Import or record a practice take.” and a 13-word comparison/export sentence. | `tests/polish.test.ts` — approved short README wording; `.factory/copy-audit.md` records 6 and 13 words; live source: <https://raw.githubusercontent.com/B-Divyesh/sf-rhythm-pedal-tidy/main/README.md>. |
| F-1-4 | Replaced the long demo explanation with separate Reset demo and Start for real sentences. | `tests/polish.test.ts` — approved short README wording; `.factory/copy-audit.md` records 5 and 14 words; live banner/reset check: <https://rhythm-pedal-tidy.sociobot.in/demo>. |
| F-1-5 | Replaced the controller-jargon sentence with plain sustain-pedal wording, split into 17 and 5 words. | `tests/polish.test.ts` — approved short README wording; `.factory/copy-audit.md`; live source: <https://raw.githubusercontent.com/B-Divyesh/sf-rhythm-pedal-tidy/main/README.md>. |
| F-1-6 | Replaced the public storage-key/IndexedDB demo explanation with “separate sample storage.” Detailed storage namespaces remain in `.factory/demo.md` and `/privacy`. | `tests/polish.test.ts` checks the replacement and rejects the demo namespace in README; `.factory/copy-audit.md` records 11 words; live source: <https://raw.githubusercontent.com/B-Divyesh/sf-rhythm-pedal-tidy/main/README.md>. |

## Live re-check

- Deployment: `/opt/fleet/lib/deploy-static.sh rhythm-pedal-tidy dist` completed
  as deployment `c5a54fec-590d-4ad4-9a7c-79010c1bf6e4`.
- `dist/index.html` and the cold live landing document share SHA-256
  `2a1e76a6091c2d60780f86f79d5eca767e1c5e4e016217420b4c74ed83cbcba8`.
- `/opt/fleet/lib/verify-url.sh` passed cold `/`, `/demo`, `/privacy/`, and
  `/terms/`; its reports and desktop/mobile screenshots are in
  `.factory/evidence/live-*`.
- A cold Playwright/Axe check found no console errors, no serious or critical
  Axe violations, and only same-origin requests on `/`, `/demo`, `/privacy/`,
  `/terms/`, and `/404.html`. The unknown-route response is HTTP 404.
