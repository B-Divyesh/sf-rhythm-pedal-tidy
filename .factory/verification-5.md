# Rhythm Pedal Tidy — independent verification 5

Date: 2026-08-30
Candidate: `26ea5d2f90758fe1b2a563227bacaa2b37df8d70`
Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: FAIL — release blockers remain

The deployed files are exactly this candidate, so these are candidate defects,
not a stale-deployment result. The fundamental demo/claims contract is absent,
and the advertised paid checkout is live-404.

## Release-blocking defects

| Severity | Finding | Fresh evidence |
| --- | --- | --- |
| P1 | Required claims contract is absent. | `.factory/claims.json` does not exist in the clean checkout; therefore there are no claim tests to run before QA and `rg '@claim:'` found none. This alone is a release block under the work order. The landing page and README nevertheless make many testable claims, including offline persistence, exports, local-only processing, no uploads, and the $12 purchase. `.factory/demo.md` is also absent. |
| P1 | There is no isolated one-click demo. | A cold live page has no **Try it with sample data** action; it has **Try the example** below the workspace, while the hero action only jumps to that workspace. `/demo` returns the normal SPA shell. On desktop and 390 px mobile it showed no “Demo — sample data, nothing is saved” banner, no Reset demo, and no Start for real. Clicking its sample stored `Warm-up in C` in the production `rhythm-pedal-tidy` IndexedDB database (not a `demo:` namespace). Source confirms `sample → loadTake → persist → saveTake` with no pathname/demo branch. Thus the sample can mix with real take history and is neither a sandbox nor resettable. |
| P1 | The advertised paid purchase cannot begin. | `GET` and `HEAD https://api.sociobot.in/api/v1/products/rhythm-pedal-tidy/checkout` returned `404` with `{"error":"enabled factory product","status":404}`. The same pilot endpoint also returns 404. The visible **Buy Plus — $12** link targets that URL, so Plus live Web MIDI/unlimited history cannot be purchased. |
| P2 | Cold first-read/plain-words acceptance fails. | The first-screen H1 is “Untangle the pedal take.” and the supporting copy does not say it is for keyboard/e-kit players. It uses the primary action “Tidy a take ↓”, not the required one-click sample action. The mandatory “what it does / for whom / click this first” test therefore fails independently of whether a visitor later finds **Try the example**. |
| P2 | Billing request allowance is not documented or verifiable. | The repository has no documented allowance, rate-limit test, `429`, or `Retry-After` contract. One invalid-license verification returned 200 JSON (`valid:false`, `reason:"invalid"`) and no rate-limit headers. Because no allowance is documented and this is the factory billing endpoint, there is no safe threshold to exceed; its required enforcement could not be confirmed. |

## Mandatory first checks

1. From the clean clone, the required `.factory/claims.json` was missing. No
   listed claim command exists or could be run. This is recorded as a failure,
   not a passing empty suite.
2. Cold live first read: it appears to be a tool for importing sustain-heavy
   MIDI, seeing overlaps, and exporting a clean take. The intended keyboard/
   e-kit audience is not stated in the first screen. The first visible hero
   control is **Tidy a take ↓**; it does not load a demo. The later **Try the
   example** control is not a demo sandbox and is not labelled as required.

## Checks that passed

### Clean candidate quality gates

- `npm ci`: passed; 96 packages installed, 0 vulnerabilities.
- `npm test`: passed, 14/14 tests.
- `npm run build`: passed (`tsc --noEmit` then Vite) and produced `dist/`.
  Initial JS is 33.89 kB raw / 12.66 kB gzip; CSS is 15.85 kB raw / 4.20 kB
  gzip, within the static budget.
- `npm run test:e2e`: passed, 15/15. There is no separate lint command;
  TypeScript checking is part of build.

### Product behavior

- Live sample flow produced 8 notes, 2 pedal presses, 3 overlaps, 2.74 s
  removed, 3 suggested cuts, and a 9 ms timing score. It offered MIDI export
  as `warm-up-in-c-tidy.mid` and session export as `warm-up-in-c.json`.
- Invalid MIDI reported “That file is not a standard MIDI file (.mid).”;
  malformed JSON reported an actionable error and retained the displayed
  take. Repository browser tests also passed invalid tempo recovery, malformed
  backup preservation, high-tempo import, keyboard replay, and focus
  retention.
- At both 1440 px and 390 px, the live document/main/body widths equalled the
  viewport. Keyboard test coverage passed; the tested import control has the
  designed paired focus treatment. Reduced-motion media reduced transition and
  animation duration to `0.00001s`.
- Playwright Axe scans of live populated desktop and 390 px pages found zero
  serious/critical violations. The repository suite additionally passed Axe
  scans for privacy and terms. `/opt/fleet/lib/verify-url.sh` passed live:
  HTTPS 200, title, `lang=en`, one h1, main landmark, image alt text, labelled
  buttons, and no normal-load console/page errors.

### Privacy, headers, PWA, and identity

- During normal live sample use, Playwright observed only product-origin
  requests: document, JS, CSS, original hero image, and same-origin
  `/online-check`. No performance data or analytics left the origin. An
  explicit invalid license is the only tested cross-origin flow and called
  the stated Sociobot verification endpoint.
- Live HTML sets HSTS, `nosniff`, `X-Frame-Options: DENY`, strict-origin
  referrer policy, CSP with `frame-ancestors 'none'`, and MIDI-only
  Permissions-Policy. Hashed JS has one-year immutable caching; HTML and the
  worker revalidate after 30 seconds.
- After a service-worker-controlled sample load, offline reload retained the
  take and cleaned-MIDI export and displayed the Offline deck notice. The
  only offline console entry was expected `ERR_INTERNET_DISCONNECTED` for the
  app's network check. A controlled old temporary worker (`sw.js?old=1`) to
  candidate `sw.js` update changed controller and displayed “A fresh version
  is ready. Update now”, with no errors.
- Local/live SHA-256 matched for `index.html`, the hashed JS/CSS, `sw.js`,
  manifest, offline page, privacy, and terms. Key app hashes: index
  `cbe29ed4b0f7d407108900a4e0c91a99ba308134413bd895a0f52bb10050b2b4`, JS
  `a88c043ecc048c2888a70989c6060e81c9f5527f737b18fec4be27e358d630f6`, CSS
  `462463ddaf9d5663d2de1b3d8e3a151998bbc09bb9fb5e89be8c12b5fa111891`, and
  worker `29d78ca85fd9db3f5ffd0699e84be94244b688e56983f81ad3e523f4561eae8e`.

## Tooling note

`npx @axe-core/cli` could not launch Selenium Chrome in this container. The
equivalent installed `@axe-core/playwright` scanner ran against the live site
on both required viewports and returned zero serious/critical issues.

## Required remediation before another verification

1. Add `.factory/claims.json`, tagged observable demo-entry tests for every
   public claim, and `.factory/demo.md`.
2. Implement `/demo` or `?demo=1` with a visible first-screen **Try it with
   sample data** action; use a separate `demo:` storage namespace, banner,
   reset, and explicit start-for-real exit.
3. Make the first-screen copy name the MIDI cleanup job and keyboard/e-kit
   audience in plain words.
4. Register/enable the production Sociobot product so checkout returns a
   hosted checkout rather than 404.
5. Document the billing verification allowance and prove its 429 +
   `Retry-After` behavior without sending uncontrolled traffic to the service.
