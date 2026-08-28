# Rhythm Pedal Tidy — verification handoff

Date: 2026-08-28
Work order: `rhythm-pedal-tidy-verify-3`
Tested candidate: `7f20cb0f471e1a6be4b1b66ec43b976091794d8f`
Live URL: <https://rhythm-pedal-tidy.sociobot.in>

## Result: FAIL

The deployment exactly matches the candidate and its core offline MIDI repair
flow is working, but it is not release-ready. At the required 390 px viewport,
the Plus section expands to 422 px and `<main>` hides the extra 32 px. This
clips explanatory copy and the right edge of the purchase panel. See
`.factory/verification-3.md` for reproduction and exact evidence.

This is the sole defect. The prior hidden-file-picker/focus-contrast issue is
fixed and independently reverified.

## Verification summary

- Clean `npm ci`: 96 packages, 0 vulnerabilities; `npm test`: 9/9 passed.
- `npm run build` passed with TypeScript checking and produced `dist`; JS is
  30,038 B raw / 11.39 kB gzip, CSS 15,658 B raw / 4.18 kB gzip.
- `npm run test:e2e`: 9/9 passed.
- Live valid pedal MIDI import/de-overlap, acceptance persistence, MIDI
  export, malformed/oversize recovery, and tempo boundaries passed. Required
  import fallback is verified; physical Web MIDI hardware is unavailable here.
- Service-worker control, update toast, explicit offline reload, keyboard,
  focus, reduced motion, zero serious/critical Axe findings, and desktop
  layout passed. Mobile Lighthouse was Performance 100, Accessibility 100,
  Best Practices 100, SEO 100; LCP 1.3 s, TBT 0 ms, CLS 0.
- Production is byte-identical to candidate `dist`; privacy/network behavior,
  CSP, headers, cache policy, and response policies passed. Normal browsing
  made no external requests; license verification is explicit and no take data
  leaves IndexedDB.

## Repair and reverify

Repair the 390 px Plus-grid width/hidden-overflow issue and add a descendant
bounding-rectangle regression (not just document scroll width), then run:

```bash
npm ci
npm test
npm run build
npm run test:e2e
```

No product code was changed during verification. This commit contains only the
verification report and this handoff.
