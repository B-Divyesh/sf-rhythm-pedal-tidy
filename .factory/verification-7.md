# Rhythm Pedal Tidy — independent verification 7

Date: 2026-08-30

Candidate commit: `f75b5c72a12b4910d3e5678ae7527a92f8bc97f8`

Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: PASS

The candidate passes the original brief, repository contract, all declared
claims, the first-read gate, full local quality gates, and independent live
product checks. The live PWA byte-matches the production build from the
candidate. No P0/P1, P2, or P3 product defects were found.

## Mandatory opening gates

### Claims: PASS — 12/12 exact commands

The checkout was clean and at the requested candidate before installation.
`.factory/claims.json` exists. After `npm ci`, every listed `test` command was
run separately, without an undocumented prerequisite. Each command performed
its own production build and passed its one selected browser test.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | Sample seeded only `demo:rhythm-pedal-tidy`; reset and exit left the real shelf untouched. |
| `pedal-overlap-repair` | PASS | Repeated C4 under a pedal held through take-end exported 0–500 ms and 500–700 ms notes, preserving starts and velocities 90/91. |
| `standard-midi-import` | PASS | Generated Standard MIDI type 0 and type 1 fixtures each imported one visible note. |
| `live-midi-input` | PASS | Deterministic Web MIDI input captured one note and one CC64 press; denial recovery was also covered. |
| `timing-score` | PASS | Sample reported score 92, mean offset 9 ms, and eight notes on the sixteenth-note grid. |
| `tempo-ramp` | PASS | One completed replay advanced 240 BPM to the configured 245 BPM finish. |
| `midi-export` | PASS | Download was `warm-up-in-c-tidy.mid` and began with `MThd`. |
| `json-data-roundtrip` | PASS | Session and all-takes JSON exported, restored, and reproduced the take. |
| `saved-take-history` | PASS | Take and acceptance survived refresh, then confirmed deletion removed IndexedDB data. |
| `offline-reload` | PASS | Dedicated context reloaded `/demo` offline, replayed, and exported valid MIDI. |
| `local-processing` | PASS | All requests during the sample flow were same-origin; scripts were same-origin. |
| `no-checkout` | PASS | No account/billing action or billing URL exists; live MIDI remains enabled. |

The exact command for every row was:

```text
npm run test:e2e -- --grep @claim:<claim-id>
```

Each invocation passed one test. The aggregate claim-gate exit status was 0.

### Cold first read: PASS

At a fresh live 1280×720 load, the first screen says:

- What it does: **Clean sustain-pedal MIDI overlaps.**
- Who it is for: keyboard and e-kit players who need clean practice takes.
- What to click: **Try it with sample data**, followed by “Loads an 8-note
  practice take right away.”

The one-click action opened `/demo` with **Warm-up in C** already loaded. The
button was fully visible at y=527.1–577.1 px, its explanation ended at y=621.5,
and all three privacy/offline/export facts ended at y=693.0 within the 720 px
viewport. The page had one H1, one main landmark, `lang="en"`, no horizontal
overflow, and no console or page errors.

## Clean-checkout quality gates

```text
npm ci                 PASS — 96 packages installed; 0 vulnerabilities
npm test               PASS — 22/22 tests in 6 files
npm run check          PASS — 22/22 tests, TypeScript, and Vite build
npm run build          PASS — exact production build created dist/
npm run test:e2e       PASS — 33/33 browser tests
```

There is no separate lint script. `npm run build` runs `tsc --noEmit` before
Vite. Package/consumer installation is not applicable to this static PWA.

Production output:

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| JavaScript | 33,828 B | 12,352 B |
| CSS | 16,925 B | 4,437 B |
| Mobile hero WebP | 52,926 B | 52,979 B |
| Desktop hero AVIF | 76,852 B | 76,882 B |

There are no downloaded fonts. The initial JavaScript, CSS, font, and hero
budgets are all met.

## Independent end-to-end product checks

### Normal and recovery paths

- The live sample opened with 8 notes, 2 pedal presses, 3 overlaps, 3 suggested
  cuts, a before/after roll, timing score, tempo ramp, acceptance, and exports.
- Live cleaned MIDI exported as a 105-byte Standard MIDI file with an `MThd`
  header.
- A live take ending while CC64 remained down produced one cut. Its exported
  cleaned notes were `{start:0,end:500,sustainedEnd:700,velocity:90}` and
  `{start:500,end:700,sustainedEnd:700,velocity:91}`.
- Invalid `not-midi` input reported “That file is not a standard MIDI file
  (.mid).” and retained the active sample.
- Start tempo `0` recovered to 30 BPM and announced the valid 30–240 range.
- The full suite additionally covered type 0/type 1 imports, 400 BPM clamping,
  malformed backup recovery, cancel/confirm deletion, refresh persistence,
  JSON restoration, Web MIDI permission denial, and service-worker updates.

### Demo and persistence boundaries

The persistent demo banner says sample data is not saved to real takes and
offers **Reset demo** and **Start for real**. Tests inspected the separate
`demo:rhythm-pedal-tidy` and `rhythm-pedal-tidy` IndexedDB databases. Reset
reseeded only the demo; Start for real cleared it and opened an empty real
workspace.

## Accessibility, keyboard, and responsive behavior

- `/opt/fleet/lib/verify-url.sh` passed live `/`, `/demo`, `/privacy/`, and
  `/terms/`: HTTPS 200, title, language, one H1, main, image alt text, labelled
  buttons, and zero console/page errors.
- Playwright Axe found **zero violations of any impact** on live `/`, `/demo`,
  `/privacy/`, `/terms/`, and `/404.html` at 390×844.
- At 390 px, `innerWidth`, `clientWidth`, and `scrollWidth` were all 390. The
  only sub-44 px item reported by a generic selector was the intentionally
  1 px wide, `tabindex=-1` visually hidden native file input; its labelled
  import button is the operable control.
- Keyboard traversal began on **Skip to workspace**. Its focus treatment was a
  3 px light outline plus a 6 px dark ring. Activating it made the next Tab stop
  the sample action, bypassing header navigation.
- Space started replay, changed the focused control to **Stop replay**, stopped
  it, and restored focus to **Replay clean take**.
- At 200% text zoom, the first sample action and both demo controls remained
  visible and operable.
- `prefers-reduced-motion: reduce` matched, set scrolling to `auto`, and reduced
  transition/animation duration to 0.01 ms.

Desktop and mobile screenshots were visually inspected. The cassette-era
rehearsal-zine identity matches `.factory/design.md`, remains task-led, and has
usable hierarchy at both widths.

## Privacy, network, headers, and server scope

A Playwright request log covering cold load, demo entry, cleanup/export, and
error recovery recorded 15 requests and **zero third-party requests**. Every
document, script, style, image, and online check used the product origin. No
analytics, tracking, external font, billing, sign-in, or performance-data
request occurred.

Playwright observed these live response policies:

```text
Content-Security-Policy: default-src 'self'; ... connect-src 'self'; ... frame-ancestors 'none'
Strict-Transport-Security: max-age=10886400; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=(), midi=(self)
```

HTML and `sw.js` use `public, must-revalidate, max-age=30`. Hashed JavaScript
and CSS use `public, max-age=31536000, immutable`. A fresh unknown route
returned the designed 404 document with HTTP 404. All internal links and the
two GitHub links returned 200; `robots.txt` and `sitemap.xml` are valid.

This is a static product with no server endpoint, product-unlock call, or
sign-in. Therefore concurrency, backend persistence, Entra authority, and
429/`Retry-After` testing are not applicable. The browser request allowance to
Sociobot billing is zero. A fresh direct check confirmed the unregistered
checkout still returns 404, so shipping all controls free is the documented,
honest fallback allowed by the repository contract.

## PWA and offline behavior

- Chromium parsed the manifest with no errors: standalone display, versioned
  start URL, 192/512/maskable icons, and thesis-matched colors.
- A fresh live context installed and activated `sw.js`, was controlled at the
  root scope, and contained cache `rpt-v7-shell`.
- `registration.update()` completed without a false update prompt. The local
  browser suite's controlled old-worker fixture passed the real waiting-worker
  toast and `controllerchange` update path.
- After network isolation, `/demo` reloaded with HTTP 200 from the service
  worker, displayed the offline banner and sample, and exported valid MIDI.
- The deliberate offline HEAD connectivity probe logged the expected
  `ERR_INTERNET_DISCONNECTED`; there were no normal-path console errors.

## Performance

Fresh mobile Lighthouse, rerun with the installed Chromium:

```text
Performance       100
Accessibility     100
Best practices    100
SEO               100
FCP                1.0 s
LCP                1.3 s
TBT                0 ms
CLS                0
Speed Index        1.0 s
Transferred        72 KiB
```

Lab INP is not available without user interactions; the repository browser
suite directly exercises replay, input, persistence, and rerender focus.

## Deployment identity

The requested candidate exists locally and equals the initial `origin/main`.
The following live files SHA-256 byte-match `dist/` from that candidate:

```text
index.html                          e850655090c8a52fd183301730f6466fc7210329d06ab61024d785f577c3cdd5
sw.js                               75650fdc137a51a5bcc6a027b723fcd877131ca093bc3d974063677e6cf55838
manifest.webmanifest                2c57e8214b35d473325c45886b17e3bf55b6aa0f9b986d8b67157d14c4c1996b
404.html                            7c7159ea57d50f6ed803abdfec71551f6770629bec15b8f3be846239a5387a97
assets/index-D_g3X4th.js            df1592a3e97da92655bdb2e49d77caa1372ffea471e325449511b9dc8d8a11c0
assets/index-u4cGqe6S.css           f8c762fd643bdcb3f5b3b4610a7e7a9bc155b6bb229c647b8d2c9b47bccfaf3d
assets/pedal-tape-hero.avif         5ad11ba0d1e1c5f699594958095153d34c0964b867e937b9f90f2d5bb8e6641d
assets/pedal-tape-hero-720.webp     b72d80abf2c4e6bc212ca3f927c85226a9ff9e14cce206b7d8a5a7fba0a7b685
assets/social-card.jpg              5897ad1a1f5d062bc1f5ce90b993024b207f536d4dff6c6f962211c787e3f0c5
```

## Defects by severity

- P0/P1 release blockers: none.
- P2 major defects: none.
- P3 minor defects: none.

## Test limitations and accepted deviation

- No physical MIDI device was available. Deterministic Web MIDI fixtures
  exercised device discovery, selection, note/CC64 capture, stop behavior, and
  permission-denial recovery.
- The one-time purchase in the researched opportunity cannot be enabled from
  this repository because the factory billing product is not registered. The
  live checkout endpoint returned `404 {"error":"enabled factory product"}`.
  The candidate does not ship a broken payment link; it exposes the complete
  useful workflow for free and documents the deviation in `.factory/billing.md`.

These limitations do not block the local-first job-to-be-done or contradict
the behavior presented by this release.
