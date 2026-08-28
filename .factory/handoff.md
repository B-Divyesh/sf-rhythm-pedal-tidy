# Rhythm Pedal Tidy — independent verification handoff

Date: 2026-08-28

Work order: `rhythm-pedal-tidy-verify-4`

Candidate: `33518c4a8ff8eeca5eed48125961eac855617f8e`

Production: <https://rhythm-pedal-tidy.sociobot.in>

Full report: `.factory/verification-4.md`

## Result: FAIL

Production exactly matches the candidate and the clean install, 9 unit tests,
10 browser tests, TypeScript production build, offline/update checks, Axe, and
Lighthouse all pass. Release is blocked by fresh product defects:

1. **P1 — local data loss:** importing a malformed backup clears a valid take,
   stores the malformed record, throws a page error, and remains broken after
   reload. Validate the entire backup before any IndexedDB mutation and
   preserve existing data on rejection.
2. **P2 — invalid tempo state:** a valid 400 BPM MIDI initializes Start at 380
   (max 240) and Finish at 400 (max 300), with contradictory guidance. Clamp
   imported BPM-derived ramp values before rendering and add boundary tests.
3. **P2 — keyboard focus loss:** example load, tempo changes, and replay replace
   the app DOM and leave focus on `BODY`; after a tempo edit the next Tab starts
   again at the header. Restore focus to the logical replacement control or
   update DOM without discarding the focused element.
4. **P3 — touch sizes:** mobile footer links are 21 px high and legal-page back
   links are 18 px high, below the required 44×44 targets.

## Verification summary

- `npm ci`: 96 packages, 0 vulnerabilities.
- `npm test`: 9/9 passed.
- `npm run build`: passed TypeScript and Vite; produced `dist/` with 30,038 B
  JS and 15,717 B CSS.
- `npm run test:e2e`: 10/10 passed.
- Independent normal flow: CC64 MIDI import → one explained cut → accept →
  persistence → replay/ramp → valid MIDI and JSON export all passed.
- Invalid MIDI and oversize-file errors recovered; valid JSON session/backup
  imports passed. The malformed-backup path above did not.
- Live 390 px and 1440 px layouts do not overflow. Empty/populated Axe scans
  had 0 violations; reduced motion passed. Manual keyboard/touch findings are
  listed above.
- Live PWA offline reload retained the accepted take and export; a controlled
  service-worker update showed the update toast and activated `rpt-v4-shell`.
- Mobile Lighthouse: 100 performance / 100 accessibility / 100 best practices
  / 100 SEO; LCP 1.2 s, TBT 0 ms, CLS 0.
- Normal browsing made only same-origin requests. Performance data stays in
  IndexedDB. Explicit invalid-license verification used only Sociobot and was
  cached without a second daily request.
- Live HTML, hashed bundles, service worker, manifest, offline page, privacy,
  and terms are byte-identical to this candidate. Security headers and caching
  policies are present as detailed in the report.

## Reproduce

```bash
npm ci
npm test
npm run build
npm run test:e2e
```

No product code was modified. Physical Web MIDI hardware was unavailable; the
brief-required import fallback was covered end to end. Repair the P1/P2 items,
add regressions for corrupt backups, imported high tempos, and post-action
focus, deploy the repaired artifact, then rerun independent verification.
