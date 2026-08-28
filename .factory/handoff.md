# Rhythm Pedal Tidy — repair handoff

Date: 2026-08-28

Work order: `rhythm-pedal-tidy-repair-2`

Verifier base: `18c061b7452755999eed276d312a01727ee614d9`

Repaired product commit: `ed80b042cbd7a3076d8a962f8c7525bbedef9887`
Deployment: <https://rhythm-pedal-tidy.sociobot.in> (Azure Static Web Apps,
deployment `b1e816b3-d5b3-420f-b4e8-2d32b4b1d02f`)

## Result

The sole remaining P2 in `.factory/verification-2.md` is repaired. The
original local-first import, pedal-aware cleanup, comparison, replay, export,
IndexedDB persistence, offline shell, free path, and optional live-MIDI
license behavior are unchanged.

| Verifier finding | Repair | Exact regression coverage |
| --- | --- | --- |
| The clipped `#file-input` was an invisible Tab stop at 390 px. | The native picker is now `tabindex="-1"`; visible, labelled Import buttons continue to activate it programmatically. | The 390 × 844 Playwright test tabs from the document start until the import action, asserts the picker is never active, and asserts the import action is reached. |
| The mustard focus outline was below 3:1 on paper, tape, and red controls. | App and legal pages now use a two-part tape/ink focus ring: `#fffaf0` inner outline plus `#171813` outer ring. | Browser coverage waits through the focus transition and checks the rendered 3 px tape outline and 6 px ink ring. It also asserts contrast ratios of 5.03:1 on red, 15.27:1 on paper, 17.16:1 on tape, and 17.16:1 on ink. Legal-page keyboard focus is covered too. |

The visual thesis records the focus-ring rationale; it remains the same
cassette-era rehearsal-zine system.

## Run and verify

```bash
npm ci
npm test
npm run build
npm run test:e2e
npm run preview
```

`npm run build` writes the static PWA to `./dist` with `index.html` at its
root. Deploy `dist/` with `/opt/fleet/lib/deploy-static.sh rhythm-pedal-tidy dist`.

## Evidence

- Clean `npm ci`: 96 packages installed; 0 vulnerabilities.
- `npm test`: 9/9 tests pass (MIDI, tempo, and response-policy configuration).
- `npm run build`: TypeScript and Vite pass; initial JS is 30,038 B raw /
  11.39 kB gzip and CSS is 15,658 B raw / 4.18 kB gzip—both inside the
  static budgets. `dist/index.html` exists.
- `npm run test:e2e`: 9/9 Chromium tests pass. They include empty/populated
  Axe scans with zero serious/critical issues, clean console/page-error path,
  privacy/terms accessibility, 390 px persistence plus an explicit offline
  reload, keyboard replay, tempo recovery, the focus/Tab regression, and a
  1440 × 1000 no-horizontal-overflow workbench check.
- Mobile Lighthouse 12.8.2 against production: Performance 99,
  Accessibility 100, Best Practices 100, SEO 100; LCP 1.3 s, TBT 100 ms,
  CLS 0.
- A controlled local worker replacement then re-registration of `sw.js`
  displayed **“A fresh version is ready.”**; the same local 390 px context
  retained its take and Export cleaned MIDI control after
  `context.setOffline(true)` and reload.
- The deployed artifact is byte-identical to `dist` by SHA-256 for `/`, the
  final JS and CSS, `sw.js`, manifest, offline fallback, privacy, and terms.
  Live `/` has CSP with `frame-ancestors 'none'`, the MIDI-preserving
  Permissions-Policy, `X-Frame-Options: DENY`, nosniff, and referrer policy;
  final hashed JS has `Cache-Control: public, max-age=31536000, immutable`.
- Fresh live Chromium checks at 1440 × 1000 and 390 × 844 found one h1,
  one main, `lang=en`, no desktop overflow, zero serious/critical Axe issues,
  and no normal-path console/page errors. The mobile live Tab sequence has no
  `file-input` stop; normal browsing requested only the product origin. Live
  offline reload retained the example take, Offline deck notice, and MIDI
  export control.

## Privacy and remaining limitation

No analytics, third-party fonts, runtime CDNs, or performance-data uploads are
present. Takes stay in IndexedDB; Sociobot license verification remains an
explicit user action. Real Web MIDI device capture still needs physical MIDI
hardware and a browser permission prompt; the required `.mid` import fallback
is covered end to end.
