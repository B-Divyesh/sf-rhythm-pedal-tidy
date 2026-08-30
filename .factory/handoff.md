# Rhythm Pedal Tidy — repair handoff

Date: 2026-08-30

Work order: `rhythm-pedal-tidy-repair-6`

Result: **PASS — repaired, pushed, and deployed**

Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Identity and scope

- Verifier report commit: `7a42ffd158b87c555de6d947b1b8aa308f74c7e1`.
- Requested candidate text in that report was unobtainable. The obtainable
  origin candidate, `7ffb4b772d8266a444568d6d18bba931749e1292`, was used as the repair base.
- Deployed product repair commit: `7b4fa47fb30f0b443def312200049f747c13ca48`.
- Branch: `main`; remote: `origin/main`.
- Artifact remains a static, local-first PWA. Production output remains
  `dist/` with `dist/index.html` at its root.

## Release-blocking findings repaired

| Verifier finding | Root-cause repair and regression |
| --- | --- |
| Exact claim commands failed after `npm ci` | `test:e2e` now builds production first. All 12 commands in `.factory/claims.json` were run independently from a clean origin clone; every command built and passed. |
| Sample action clipped at 1280×720 | Height-aware desktop layout keeps the action, explanation, and three facts above the fold. Browser regression measures their bounds. Live action bounds: y 527.09–577.09; facts end at y 692.97. |
| Held pedal at end of take was ignored | A CC64-down with no CC64-up now extends eligible notes to the captured take end. A following strike of the same pitch trims the earlier note at that strike. Unit and browser export regressions cover the verifier's exact events. |
| Public promises were not inventoried | `.factory/claims.json` now lists 12 public promises. Each has exactly one `@claim:<id>` test that asserts its observable result. Copy and README claims were reconciled with this inventory. |
| Unknown routes returned the app with 200 | Added a designed `404.html`; Azure Static Web Apps now rewrites missing paths through a 404 response override. A live unknown path returns HTTP 404. |
| Metadata and build identity were incomplete | Added root and route-specific title, description, canonical, Open Graph, Twitter, favicon, Apple touch icon, social image, product footer, factory credit, and v1.0.1 identity. |
| Desktop navigation targets were undersized | Navigation targets are at least 44 px high; measured live widths are 48.97–95.19 px. |
| MIDI permission denial lacked recovery | The error now directs the user to allow MIDI in site settings and reconnect, or import a `.mid` file. A deterministic Web MIDI test covers capture and denial. |

## Exact failure reproduction and repair proof

Before editing, the verifier's no-pedal-up sequence was run directly against
the candidate code:

```text
notes: C4 0–200 ms; C4 500–700 ms
pedal: down at 50 ms; no pedal-up event
candidate result: changedCount 0; sustainedCount 0
```

The repaired result preserves both attacks and velocities, extends the first
note to the repeated strike at 500 ms, and retains the second note through the
captured take end at 700 ms. The browser regression also exports and decodes
the resulting MIDI to prove the repaired boundaries survive the product's
real output path.

The clean-command failure was also reproduced from candidate
`7ffb4b772d8266a444568d6d18bba931749e1292`: after `npm ci`, all six original
claim commands failed because `dist/` did not exist. The repaired scripts
perform the required production build themselves.

## Clean-clone verification

Verified from a fresh clone of `origin/main` at product repair commit
`7b4fa47fb30f0b443def312200049f747c13ca48`:

```text
npm ci                 PASS — 96 packages, 0 vulnerabilities
npm test               PASS — 22/22 unit and integration tests
npm run check          PASS — TypeScript/build checks and 22/22 tests
npm run test:e2e       PASS — production build plus 33/33 browser tests
npm run build          PASS — dist/ created with index.html at its root
```

There is no separate lint script; strict TypeScript checking runs in the
production build. Package/consumer testing is not applicable to this static
PWA.

Production asset sizes:

- JavaScript: 33,828 B raw / 12,352 B gzip.
- CSS: 16,925 B raw / 4,437 B gzip.
- Mobile hero: 52,926 B.
- AVIF hero: 76,852 B.
- Social preview: 200,486 B and not part of the displayed first-load UI.

## Claims verification

Every exact command in `.factory/claims.json` was run separately after only a
clean clone and `npm ci`. Each invocation performed its own production build
and passed its one tagged test.

| Claim id | Observable coverage | Result |
| --- | --- | --- |
| `demo-isolation` | Demo data stays in its separate namespace | PASS |
| `pedal-overlap-repair` | Held pedal, repeated pitch, and MIDI boundaries | PASS |
| `standard-midi-import` | Type 0 and type 1 MIDI fixture imports | PASS |
| `live-midi-input` | Web MIDI note/pedal capture and denial recovery | PASS |
| `timing-score` | Exact sample score, drift, and on-grid count | PASS |
| `tempo-ramp` | 240→245 BPM ramp result | PASS |
| `midi-export` | Download begins with a valid `MThd` header | PASS |
| `json-data-roundtrip` | Session and all-takes JSON restore | PASS |
| `saved-take-history` | IndexedDB persistence, accept, and delete | PASS |
| `offline-reload` | Fresh context, service worker, offline reload and export | PASS |
| `local-processing` | Full demo request log remains same-origin | PASS |
| `no-checkout` | Core workflow has no account or billing gate | PASS |

## Browser, accessibility, privacy, and PWA evidence

- Desktop Chromium at 1280×720: sample action, explanation, and all facts are
  visible; navigation targets meet 44 px; keyboard starts on a visible skip
  link with a 3 px focus outline.
- Mobile Chromium at 390 px: no horizontal overflow (`scrollWidth` 390), full
  demo workflow passes, and the layout remains usable.
- Keyboard coverage: skip link, primary actions, file inputs, navigation,
  menus, take history, and dialogs are operable; focus management regressions
  pass.
- Playwright Axe: zero serious or critical violations on `/`, `/demo`,
  `/privacy/`, `/terms/`, and `/404.html` locally and live at 390 px.
- Factory URL verifier: title, language, one h1, main landmark, alt text, and
  console checks pass on all local routes; live root and demo report no
  console errors.
- Privacy: the full sample flow made five requests, all to the product origin;
  there are no analytics or third-party runtime scripts.
- PWA: manifest has no installability errors. A fresh service-worker context
  reloads sample data offline and exports valid MIDI. Update lifecycle tests
  pass repeatedly, including the `controllerchange` race.
- Link crawl: every public internal and external link returns 200; an unknown
  product path returns the designed page with HTTP 404.
- Response policy: CSP, HSTS, `nosniff`, strict-origin referrer policy,
  frame denial, and a MIDI-only permissions policy are live. Hashed assets use
  immutable caching; HTML uses short revalidation.
- Reduced motion, zoom, contrast, semantic landmarks, and touch-target checks
  are covered by the browser suite.

## Production performance and identity

Live mobile Lighthouse:

```text
Performance      100
Accessibility    100
Best practices   100
SEO              100
FCP               0.9 s
LCP               1.2 s
TBT               0 ms
CLS               0
Speed Index       0.9 s
```

The deployed custom-domain files byte-match the final production build:

```text
index.html                         e850655090c8a52fd183301730f6466fc7210329d06ab61024d785f577c3cdd5
sw.js                              75650fdc137a51a5bcc6a027b723fcd877131ca093bc3d974063677e6cf55838
manifest.webmanifest               2c57e8214b35d473325c45886b17e3bf55b6aa0f9b986d8b67157d14c4c1996b
404.html                           7c7159ea57d50f6ed803abdfec71551f6770629bec15b8f3be846239a5387a97
assets/index-D_g3X4th.js           df1592a3e97da92655bdb2e49d77caa1372ffea471e325449511b9dc8d8a11c0
assets/index-u4cGqe6S.css          f8c762fd643bdcb3f5b3b4610a7e7a9bc155b6bb229c647b8d2c9b47bccfaf3d
assets/social-card.jpg             5897ad1a1f5d062bc1f5ce90b993024b207f536d4dff6c6f962211c787e3f0c5
```

## Deployment

The `dist/` artifact was uploaded to the existing Azure Static Web Apps
production target configured for this product. No infrastructure, DNS,
billing, or payment configuration was changed.

## Known gaps

- Physical MIDI hardware was unavailable in the worker container. A
  deterministic browser Web MIDI fixture exercises device connection, note
  capture, pedal events, and permission-denial recovery.
- Standalone Axe CLI could not start because the container's Selenium driver
  did not match its Chromium. The supported Playwright Axe integration ran on
  every route locally and live with zero serious or critical violations.
- This product has no backend, checkout, or package consumer surface, so those
  test categories are not applicable.
