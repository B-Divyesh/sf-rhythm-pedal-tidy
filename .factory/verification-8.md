# Rhythm Pedal Tidy — independent verification 8

Date: 2026-08-30

Candidate commit: `b6113382f14067bbc67693b686ce82a6973f5346`

Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: PASS

The candidate passes the original brief, repository contract, mandatory claim
gate, cold first-read gate, local quality gates, and independent live product
checks. The live PWA byte-matches the candidate production build. No
release-blocking or major defects were found. One minor cache-versioning defect
is recorded below; it does not affect the current release.

## Mandatory opening gates

### Claims: PASS — 13/13 exact commands

The checkout was clean and exactly at the requested candidate before
installation. `.factory/claims.json` exists. After `npm ci`, every listed
`test` command was run separately. Every invocation built the product and
passed its one selected Chromium test.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | The sample existed only in `demo:rhythm-pedal-tidy`; reset and exit left both demo and real collections empty. |
| `pedal-overlap-repair` | PASS | A repeated C4 with the pedal held through take-end exported 0–500 ms and 500–700 ms notes while preserving starts and velocities 90/91. |
| `standard-midi-import` | PASS | Generated Standard MIDI type 0 and type 1 fixtures each imported one visible note. |
| `live-midi-input` | PASS | A deterministic Web MIDI input captured one note and one CC64 press. |
| `timing-score` | PASS | The sample reported score 92, mean offset 9 ms, and eight on-grid sixteenth notes. |
| `tempo-ramp` | PASS | One replay advanced the configured tempo from 240 to 245 BPM. |
| `tempo-control-ranges` | PASS | Start 30–240, Finish Start–300, and Step 1–30 accepted both bounds and corrected every out-of-range value with an announcement. |
| `midi-export` | PASS | `warm-up-in-c-tidy.mid` downloaded with an `MThd` header. |
| `json-data-roundtrip` | PASS | One-take and all-takes JSON exported, restored, and reproduced the take. |
| `saved-take-history` | PASS | Take and acceptance survived refresh; confirmed deletion removed IndexedDB data. |
| `offline-reload` | PASS | A dedicated context reloaded the demo offline, replayed it, and exported valid MIDI. |
| `local-processing` | PASS | Every request during the demo flow was same-origin; scripts were same-origin. |
| `no-checkout` | PASS | No account, billing action, or product API URL exists; live MIDI is ungated. |

The exact command for each row was its `.factory/claims.json` value:

```text
npm run test:e2e -- --grep @claim:<claim-id>
```

Each invocation passed one test. The aggregate exit status was 0.

### Cold first read: PASS

At fresh live loads, the first screen answers all three required questions:

- What: **Clean sustain-pedal MIDI overlaps.**
- For whom: keyboard and e-kit players who need clean practice takes.
- First action: **Try it with sample data**, followed by “Loads an 8-note
  practice take right away.”

The action, explanation, and three privacy/offline/export facts fit inside
both 1280×720 and 390×844 viewports. On mobile the final fact ended at 773.6 px.
One keyboard activation opened the already-populated **Warm-up in C** demo,
with its before/after roll and **Accept cleanup** decision in the first mobile
viewport. Screenshots are in `.factory/verification-8-evidence/`.

## Clean-checkout quality gates

```text
npm ci                 PASS — 96 packages installed; 0 vulnerabilities
npm test               PASS — 28/28 tests in 7 files
npm run check          PASS — 28/28 tests, TypeScript, and production build
npm run build          PASS — exact Vite production build created dist/
npm run test:e2e       PASS — 36/36 Chromium tests
```

There is no separate lint script. `npm run build` runs `tsc --noEmit`. Library,
CLI, and clean-consumer package checks do not apply to this static PWA.

| Initial asset | Raw | Gzip/transfer evidence |
| --- | ---: | ---: |
| JavaScript | 34,584 B | 12.63 kB gzip; 12,875 B Lighthouse transfer |
| CSS | 19,377 B | 4.87 kB gzip; 5,106 B Lighthouse transfer |
| Mobile hero WebP | 52,926 B | 53,013 B Lighthouse image transfer |
| Fonts | 0 B | No font request |

All static-product budgets pass.

## Independent live product checks

### Core job and recovery

- The sample loaded 8 notes, 2 pedal presses, 3 overlaps, 3 suggested cuts,
  a before/after roll, timing score, replay ramp, acceptance, and exports.
- Live cleaned MIDI was a valid 105-byte Standard MIDI download.
- A take ending while CC64 remained down produced one cut. Exported cleaned
  notes were `{start:0,end:500,sustainedEnd:700,velocity:90}` and
  `{start:500,end:700,sustainedEnd:700,velocity:91}`.
- Invalid `not-midi` input gave a specific Standard MIDI error and preserved
  the active sample.
- Live Start 29, Finish 301, and Step 0 recovered to 30, 300, and 1. The exact
  claim test also exercised all lower and upper bounds.
- A deterministic live Web MIDI input captured one note and one pedal press.
  A separate permission-denial context explained browser-setting recovery and
  offered `.mid` import.
- The full browser suite additionally covered malformed backup recovery,
  type 0/type 1 import, a 400 BPM source, blank tempo recovery, refresh
  persistence, JSON restore, cancel/confirm deletion, and update handling.

### Demo and persistence boundaries

The demo banner remained visible and offered **Reset demo** and **Start for
real**. Direct IndexedDB inspection found the sample only in
`demo:rhythm-pedal-tidy`; `rhythm-pedal-tidy` remained empty. Reset restored
only the sample. Start for real cleared demo data and opened the empty real
workspace.

## Accessibility, keyboard, and responsive behavior

- `/opt/fleet/lib/verify-url.sh` passed live `/`, `/?demo=1`, `/demo`,
  `/privacy/`, and `/terms/`: HTTPS 200, title, `lang`, one H1, main landmark,
  alt text, labelled buttons, and no console/page errors.
- Playwright Axe reported zero violations of any impact on `/`, `/?demo=1`,
  `/demo`, `/privacy/`, `/terms/`, and `/404.html` at both 1440×900 and
  390×844.
- At 390 px, `clientWidth` and `scrollWidth` were both 390. No visible,
  operable link, button, input, or select measured below 44×44 px.
- The primary action showed a 3 px high-contrast focus outline. Enter opened
  the demo. Space started and stopped replay while restoring logical focus.
- At 200% text zoom, the sample action, Reset demo, and Start for real remained
  visible and operable with no horizontal overflow.
- With reduced motion requested, the media query matched, transition and
  animation duration became 0.01 ms, and scroll behavior became `auto`.
- Desktop and mobile screenshots were visually inspected. The cassette-era
  rehearsal-zine system is distinct, readable, and consistent with
  `.factory/design.md`.

## Privacy, network, headers, and server scope

A Playwright request log covering cold load, demo entry, cleanup, export,
invalid input, reset, and exit recorded 14 requests. Every request was to
`rhythm-pedal-tidy.sociobot.in`; no analytics, tracking, external fonts,
billing, sign-in, or performance-data upload occurred. Source inspection found
only the same-origin connectivity probe and service-worker fetches.

The live document response included:

```text
Content-Security-Policy: default-src 'self'; ... connect-src 'self'; ... frame-ancestors 'none'
Strict-Transport-Security: max-age=10886400; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=(), midi=(self)
```

HTML and `sw.js` use `public, must-revalidate, max-age=30`. Hashed JS and CSS
use `public, max-age=31536000, immutable`. An unknown route returned the styled
404 document with HTTP 404. All product-origin links plus `robots.txt`,
`sitemap.xml`, and the manifest returned 200.

This product has no backend, server endpoint, product-unlock call, or sign-in.
Concurrency, backend persistence, Entra authority, and 429/`Retry-After`
checks are therefore not applicable. Its browser billing/API request allowance
is exactly zero.

## PWA and offline behavior

- The manifest has a versioned start URL, standalone display, thesis-matched
  colors, and 192/512/maskable icons.
- A fresh live context installed and activated `/sw.js`, was controlled at the
  root scope, and held cache `rpt-v9-shell`.
- `registration.update()` completed without a false update prompt. The local
  36-test suite also replaced an active worker and passed the real
  `controllerchange` update-toast and refresh-control path.
- After network isolation, `/demo` reloaded from the service worker, showed
  the offline state, retained the sample, replayed, and exported valid MIDI.
- The only offline console message was Chromium's expected
  `ERR_INTERNET_DISCONNECTED` for the deliberate same-origin connectivity
  probe. Normal online flows had zero console/page errors.

## Performance

Fresh mobile Lighthouse 12.8.2 against the live URL:

```text
Performance       100
Accessibility     100
Best practices    100
SEO               100
FCP                0.9 s
LCP                1.2 s
TBT                0 ms
CLS                0
Speed Index        1.4 s
Transferred        74,357 B
```

Lab INP is not produced without field/user-interaction data. Replay, import,
tempo, persistence, and rerender focus interactions completed without delay in
the browser tests. The Lighthouse JSON is retained with the evidence.

## Deployment identity

The requested candidate equals the initial local `HEAD` and `origin/main`.
These representative live files exactly match the fresh `dist/` build:

```text
index.html                       5e188389d6c5459a9ef4d7c11a930c7bd1baf6822afb6674ab337e7c68468986
sw.js                            3a6bf90bd62d66e3534c78839400213be11002c836faeab6ae572ad19a6789f6
manifest.webmanifest             22e4e32d0fceb228b8394a423bc22fcb89b0c99c6e95f7518c12289d2b22b879
404.html                         c0994463882be13313aca5e990c478b1ed0a8686a375fe953eedcfd11b589920
privacy/index.html               a1e7bbd4849d0126ffbed7aab7ac865a6894e5ffdc5629cc143a1a5ed7dd3bb9
terms/index.html                 006e882b57be62895ec82461a02ae64bc755657bfaac38f7839ac96c48901548
assets/index-D77awHTL.js         cfc4a87dd933efab01aa9bd928e1f44ba4f2b1e015e5ea772a77046cf6e58b3b
assets/index-BsTtu8D7.css        b55efa1c0a97ec748f520fd3cee6d533507f1ffbe3ce6f39994726b8efe95a9d
assets/pedal-tape-hero.avif      5ad11ba0d1e1c5f699594958095153d34c0964b867e937b9f90f2d5bb8e6641d
assets/pedal-tape-hero-720.webp  b72d80abf2c4e6bc212ca3f927c85226a9ff9e14cce206b7d8a5a7fba0a7b685
assets/social-card.jpg           5897ad1a1f5d062bc1f5ce90b993024b207f536d4dff6c962211c787e3f0c5
```

## Defects by severity

- P0/P1 release blockers: none.
- P2 major defects: none.
- P3 minor: `staticwebapp.config.json` applies one-year `immutable` caching to
  every `/assets/*` file, including stable, unhashed names such as
  `pedal-tape-hero.avif` and `social-card.jpg`. A future art replacement at the
  same URL can remain stale for an existing client. Version/hash those names or
  reserve immutable caching for hashed files. Current live bytes match the
  candidate, so this does not affect this release's behavior.

## Limitations

- No physical MIDI device was available. Deterministic Web MIDI fixtures
  exercised discovery, selection, note/CC64 capture, stop behavior, and denial
  recovery against both the candidate and live deployment.
- External GitHub links were not fetched because the work order prohibited
  connecting to resources outside this product. Their hrefs were inspected;
  every internal link was live-checked.
- The researched one-time purchase is not present. The candidate honestly
  exposes the complete useful workflow for free and makes no broken payment
  promise or request, as documented in `.factory/billing.md`.

