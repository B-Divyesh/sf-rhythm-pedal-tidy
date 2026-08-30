# Rhythm Pedal Tidy — independent verification 6

Date: 2026-08-30

Requested candidate: `7ffb4b2ddb66be7ce556befaac9625cb65d0c63c`

Available repository head tested: `7ffb4b772d8266a444568d6d18bba931749e1292`

Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: FAIL — release blockers remain

The requested candidate cannot be obtained from the supplied clone or its
GitHub remote. The live deployment is byte-for-byte identical to the build of
the available `main` head, but that is a different commit. Independent testing
of that available build also found claim-gate, first-read, and core MIDI repair
failures. The good results below do not override those mandatory failures.

## Release-blocking defects

| Severity | Finding | Fresh evidence |
| --- | --- | --- |
| P1 | The requested candidate does not exist in the supplied repository or remote, so its identity cannot be verified. | `git fetch origin 7ffb4b2ddb66be7ce556befaac9625cb65d0c63c` returned `fatal: remote error: upload-pack: not our ref`; `git cat-file` also rejected it. `git ls-remote origin refs/heads/main` and the clean clone both resolve to `7ffb4b772d8266a444568d6d18bba931749e1292`. |
| P1 | Every exact claim command fails from a clean installed clone. | Before installation, all six commands failed because `@playwright/test` was absent. More importantly, after `npm ci` and before any build, every command again failed: `test:e2e` starts `vite preview`, but `dist/` does not exist. The browser received an empty/404 document, producing missing-title, missing-heading, and missing-control failures. Only after the undocumented prerequisite `npm run build` did all six claim tests pass. The commands in `.factory/claims.json` therefore are not independently runnable from the required clean state. |
| P1 | The cold desktop first screen does not show a usable first action. | At 1280×720, the live hero explains the job (“Clean sustain-pedal MIDI overlaps”) and audience (“For keyboard and e-kit players…”), but the sample action starts at y=713.16 and is 50 px high. Only about 7 px of the button is inside the viewport; its label and the adjacent explanation are unreadable. The facts are below it. A cold visitor is not told what to click within the first screen. At 390×844 the action is visible at y=574.14, so this is a responsive desktop-height defect. |
| P1 | Cleanup fails when a take ends while the sustain pedal remains down. | Directly calling `tidyTake` with two C4 notes (0–200 ms and 500–700 ms) and one CC64-down event at 50 ms, with no pedal-up event, returns `changedCount: 0`, `sustainedCount: 0`, and unchanged note ends. A live recording can naturally stop before pedal release. The exported MIDI omits CC64, so this path shortens the sustained first note instead of preserving it to the next strike and removing the repeated-note overlap. This breaks the core job and the “without changing timing” promise. |
| P1 | Public claims are missing from `.factory/claims.json`. | The README and UI promise Standard MIDI type 0/1 import, compatible live Web MIDI input, timing scoring, tempo-ramp replay, session/all-takes JSON export, saved take history, and no analytics/tracking. None has its own claim entry or `@claim:<id>` test. The claims contract explicitly makes any unlisted claim a failed review. |

## Other defects

| Severity | Finding | Evidence |
| --- | --- | --- |
| P2 | There is no real 404 route. | Live `/404.html` and `/does-not-exist` both return HTTP 200 and render the normal product H1, not a styled not-found page with a route back. `staticwebapp.config.json` has no 404 `responseOverrides`. |
| P2 | Required share/route metadata and site-wide shell details are incomplete. | The landing HTML has no Open Graph or Twitter card fields. `/demo` initially ships the root title/canonical and changes only `document.title`; its canonical remains `/`. Privacy and Terms use a different minimal header/footer. The app footer lacks “Built by Param Factory” and a version/build ID. |
| P2 | Desktop header links miss the 44 px target rule. | At 1280 px, Demo, Workspace, Takes, and Privacy measure 21 px high (widths 37, 83.2, 46.2, and 64.7 px). Keyboard focus is visible, but the required pointer/touch target height is not met. |
| P3 | Web MIDI permission denial lacks a recovery instruction in the status message. | In fresh Chromium, selecting **Connect live MIDI** produced only “Permission to use Web MIDI API was not granted.” The import fallback remains visible elsewhere, but the error itself does not tell the user to import a `.mid` file or how to retry permission. |

## Mandatory first checks

### Claims

`.factory/claims.json` exists with six entries. Each exact command was run
separately before broader QA. All six failed before dependency installation,
as expected in the literal clean clone, with `ERR_MODULE_NOT_FOUND` for
`@playwright/test`. After `npm ci`, all six still failed because no `dist/`
exists and the configured server is `npm run preview`:

```text
@claim:demo-isolation          FAIL — landing h1 not found
@claim:pedal-overlap-repair    FAIL — title was empty
@claim:midi-export             FAIL — title was empty
@claim:offline-reload          FAIL — sample heading not found
@claim:local-processing        FAIL — title was empty
@claim:no-checkout             FAIL — landing text not found
```

After manually running `npm run build`, the same six exact commands each
passed. This confirms the tested flows work but the published claim commands
are not self-contained.

### Cold first read

What it does: removes sustain-pedal MIDI overlaps without changing note-start
timing. Who it is for: keyboard and e-kit players recording practice takes.
What to click first: not answerable from the 1280×720 first screen because the
sample button is clipped below the fold. A mobile 390×844 cold load does show
**Try it with sample data** and its “Loads an 8-note practice take right away”
explanation.

## Passing evidence on available head `7ffb4b772…`

### Clean install and repository gates

```text
npm ci             PASS — 96 packages, 0 vulnerabilities
npm test           PASS — 15/15
npm run build      PASS — tsc --noEmit + Vite; dist/ produced
npm run check      PASS — unit/type/build
npm run test:e2e   PASS — 23/23, after dist/ existed
```

No lint script exists. The full browser suite covers the six claims, 390 px
and desktop layout, 200% zoom, visible keyboard focus and retained focus after
rerenders, reduced motion, invalid tempo recovery, malformed backup recovery,
400 BPM import, service-worker first install/update, offline reload, and legal
routes.

### End-to-end behavior

- The one-click `/demo` path loads **Warm-up in C** with 8 notes, 2 pedal
  presses, 3 overlaps, and 3 suggested cuts in only the
  `demo:rhythm-pedal-tidy` IndexedDB database.
- Reset demo reseeds only demo data; Start for real clears it and returns to an
  empty real take shelf.
- Cleaned MIDI downloads as `warm-up-in-c-tidy.mid` with the Standard MIDI
  `MThd` header. Invalid MIDI reports “That file is not a standard MIDI file
  (.mid).” and leaves the sample usable.
- A 400 BPM file imports, clamps the replay inputs to 240/300 BPM, survives a
  reload, exports a valid one-note session, preserves the take when deletion
  is cancelled, and removes it after confirmation.
- A physical MIDI device was not available. Chromium’s permission-denied path
  was exercised; import remains usable.

### Accessibility and responsive checks

- `/`, `/demo`, `/privacy/`, and `/terms/` had zero serious or critical
  Playwright Axe findings. Root and demo also passed
  `/opt/fleet/lib/verify-url.sh`: HTTPS 200, title, `lang=en`, one H1, main,
  alt text, labelled controls, and no normal-path console/page errors.
- Keyboard traversal starts at the visible skip link and reaches all tested
  controls. Focus uses a 3 px light outline plus 6 px dark ring. Reduced motion
  reports `0.00001s` transition/animation durations and `scroll-behavior:auto`.
- Document width equals viewport width at 1280 px and 390 px. The mobile demo
  has no clipped controls; its only sub-44 px element reported by the generic
  audit is the intentionally hidden, non-tabbable file input.

### Privacy, headers, PWA, and server scope

- A Playwright request log for landing, sample cleanup, export, invalid import,
  and offline reload contained only `https://rhythm-pedal-tidy.sociobot.in`.
  There are no analytics, third-party scripts/fonts, billing calls, or
  performance-data uploads in that flow.
- Browser response headers include HSTS, `nosniff`, `X-Frame-Options: DENY`,
  strict-origin referrer policy, same-origin-only CSP `connect-src`, and a
  MIDI-only Permissions Policy. HTML and `sw.js` revalidate at 30 seconds;
  hashed assets use `public, max-age=31536000, immutable`.
- The manifest parsed without errors and Chromium reported no installability
  errors. A controlled worker-update test passed. After the first controlled
  visit, a 390 px live demo reloaded offline with its take, offline notice, and
  MIDI export available. The only offline console entry was the expected
  `ERR_INTERNET_DISCONNECTED` connectivity probe.
- This static product has no server-side application or unlock endpoint.
  `.factory/billing.md` documents a billing-request allowance of zero, so a
  product API 429/`Retry-After` check is not applicable. There is no sign-in.

### Performance and budgets

Fresh mobile Lighthouse against live: Performance **100**, Accessibility
**100**, Best Practices **100**, SEO **100**; FCP **1.0 s**, LCP **1.3 s**,
TBT **0 ms**, CLS **0**, Speed Index **1.0 s**.

Production assets are within budget: JS 32,678 B raw / 12.12 kB gzip; CSS
16,538 B raw / 4.33 kB gzip; desktop AVIF hero 76,852 B; mobile WebP hero
52,926 B; no font download.

### Deployment identity for the available head

Local `dist/` and live SHA-256 values match:

```text
index.html                  e39fcbed939c195aadbeb92d2d63e7bd998aa795e5cbd39ac994e9edd753a939
sw.js                       73a83f1d0e286a91ed1f4336d1936cce2fc1deb888f49c1d2d91a97ee125ce2b
manifest.webmanifest        9305e0db89bcc628437ad5999861c0f65df16a93f863da36cc9e72c5f353a688
assets/index-Bgpoe8ei.js    278da9423017e11816fc608aa0ab1c69992a167c12221f208c65349fb4b9209f
assets/index-DcB6-hwY.css   2bc571efb9ef91c9a085519993647187bedf742d148948199f77677d3bfff4be
pedal-tape-hero-720.webp     b72d80abf2c4e6bc212ca3f927c85226a9ff9e14cce206b7d8a5a7fba0a7b685
```

These hashes identify the live deployment as the build of available `main`
`7ffb4b772d8266a444568d6d18bba931749e1292`; they cannot identify it as the
unavailable requested candidate.

## Required remediation

1. Publish the intended candidate commit, or correct the candidate ID, then
   redeploy and repeat identity verification.
2. Make each command in `.factory/claims.json` self-contained from `npm ci`
   (for example, build in the test server command) and rerun each separately.
3. Fit the sample action, its result explanation, and the three facts inside a
   1280×720 first screen.
4. Define end-of-take sustain behavior. Preserve a still-held pedal at least
   through the next same-pitch strike, add the boundary regression, and verify
   the exported MIDI audibly preserves the take.
5. Inventory every public promise and add one observable `@claim:` sandbox
   test per claim, or remove the promise.
6. Add the required real 404, route/share metadata, consistent footer/build
   identity, and 44 px desktop navigation targets.
