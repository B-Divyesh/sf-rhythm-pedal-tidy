# Independent verification — FAIL

Date: 2026-08-28

Work order: `rhythm-pedal-tidy-verify-4`

Candidate commit: `33518c4a8ff8eeca5eed48125961eac855617f8e`

Production URL: <https://rhythm-pedal-tidy.sociobot.in>

## Verdict

**FAIL.** Production is byte-identical to the candidate, all repository gates
pass, and the normal local-first cleanup flow is useful and polished. The
candidate is not releasable because invalid backup input can destroy existing
local takes and leave the app in a persistently broken state. The tempo-ramp
boundary, keyboard-focus, and mobile touch-target contracts also have fresh
failures.

## Defects

| Severity | Finding | Fresh evidence / impact |
| --- | --- | --- |
| P1 | A malformed backup replaces valid local data before it is validated, then breaks the app across reloads. | Starting with `Warm-up in C` stored in IndexedDB, importing `{"version":1,"takes":[{"id":"broken","name":"Broken backup","createdAt":"2026-08-28T00:00:00Z","source":"json","bpm":120,"notes":[{"id":"n","pitch":60,"channel":0,"velocity":100,"startMs":0,"endMs":100}]}]}` changed the stored names from `["Warm-up in C"]` to `["Broken backup"]`. The missing `pedals` field then caused the uncaught page error `Cannot read properties of undefined (reading 'filter')`. Reload produced the same page error, showed the initial empty workspace with no explanation, and retained only `Broken backup`; the valid take was gone. `handleFile()` calls `replaceAllTakes()` as soon as it sees a `takes` array and renders only afterward, with no schema validation or confirmation. A corrupt or hand-edited backup can therefore cause unrecoverable local data loss. |
| P2 | A valid high-tempo MIDI initializes the ramp outside every advertised limit. | Importing a valid type-0 file with a 150,000 µs/quarter tempo event (400 BPM) produced Start `380` with `min=30`, `max=240`, `checkValidity() === false`; Finish `400` with `min=380`, `max=300`, `checkValidity() === false`; and **BPM now 380**. The guidance became the contradictory “Finish is 380–300 BPM.” `loadTake()` derives the initial values directly from the file BPM without applying the ramp limits, so the earlier field-change validation does not protect imported boundary values. |
| P2 | Core keyboard actions discard focus and restart sequential navigation. | On live 390 px Chromium, activating **Try the example** with Enter left `document.activeElement` as `BODY`. Editing Start to `90` and pressing Tab also left focus on `BODY`; the next Tab returned to the header’s **Rhythm Pedal Tidy home** link rather than the next tempo control. Starting replay with Space likewise moved focus to `BODY`. The whole app is replaced through `app.innerHTML` after actions without restoring focus. Keyboard users must traverse much of the page again after changing a ramp value or operating transport. |
| P3 | Several mobile links miss the contract’s 44×44 CSS-pixel touch target. | At 390 px, footer links measured Privacy `64.7×21`, Terms `46.2×21`, and Source `55.5×21`; the legal-page back link measured `182.4×18`. The header home link was `152×42`. Spacing prevents overlap and Axe/Lighthouse do not flag these, but their actual hit areas do not meet the attached design/accessibility requirement. |

## Passing evidence

### Clean checkout and repository gates

- Verification ran from a clean detached worktree at exactly the candidate.
- `npm ci`: 96 packages installed, **0 vulnerabilities**.
- `npm test`: **9/9 passed** across MIDI, tempo, and delivery-policy tests.
- `npm run build`: passed `tsc --noEmit` and the exact Vite production build;
  `dist/` was produced. There is no separate lint script.
- Build output: JS **30,038 B raw / 11.39 kB gzip**, CSS **15,717 B raw /
  4.19 kB gzip**, mobile hero WebP **52,926 B**. These are within the
  200/50/300 kB budgets. No font files ship.
- `npm run test:e2e`: **10/10 passed** in the pinned Playwright 1.58.2
  Chromium. The independent defects above are gaps in that suite.

### Product workflow and recovery paths

- An independently constructed type-0 CC64 passage imported as
  `pedal-repeat`: 2 notes, 1 pedal press, **1 overlap**, and **0.50 s** removed.
  Accepting the cleanup survived reload. Exported `pedal-repeat-tidy.mid` was
  51 bytes and began with `MThd`.
- The included example produced 8 notes, 2 pedal presses, 3 cuts, 2.74 s
  removed, a score of 92, and an explainable before/after view.
- A full replay completed and advanced 100 → 105 BPM with the announcement
  “Replay complete. Next pass: 105 BPM.” Reset returned it to 100 BPM.
- Session JSON and all-data backup exports were imported successfully in a
  clean browser; the imported take and status messages were correct.
- Invalid `bad.mid` announced “That file is not a standard MIDI file (.mid).”
  and a subsequent valid import recovered. A 20 MiB + 1 B file announced
  “That file is over 20 MB. Split the take and try again.”
- Removing a take required a specific confirmation; cancel preserved it and
  confirm removed it with a status announcement.
- Physical Web MIDI hardware and its permission prompt were unavailable in
  the container. The required `.mid` fallback was exercised end to end.

### PWA, accessibility, responsive behavior, and performance

- A fresh live 390×844 profile loaded and accepted a take, became
  service-worker controlled, went offline, and reloaded with the take,
  acceptance, offline banner, export action, and `/privacy/` page intact.
  The only offline console message was Chromium's expected
  `ERR_INTERNET_DISCONNECTED`; the online path had no console/page errors.
- A controlled temporary old-worker → candidate-worker update displayed
  **“A fresh version is ready. Update now”** and replaced `rpt-old-shell` with
  `rpt-v4-shell`. Candidate source was not changed.
- Chromium parsed the manifest with no errors and reported no installability
  errors; standalone display, versioned start URL, 192/512/maskable icons, and
  matching theme/background colors are present.
- Fresh Axe scans on empty and populated live pages at 390×844 and 1440×1000
  found **0 violations**, hence 0 serious/critical findings. Repository tests
  also cover both legal pages. The live page has `lang=en`, one h1, one main,
  a title, and meaningful image alt text.
- The initial skip-link focus treatment was visibly measurable as a 3 px
  light outline plus 6 px dark outer ring. The focus-retention and touch-size
  defects above require manual testing beyond Axe.
- Reduced-motion emulation produced 0.01 ms transitions/animations and
  `scroll-behavior: auto`.
- Both viewport layouts had no horizontal overflow; at 390 px, main and Plus
  each had `clientWidth=scrollWidth=390` and main overflow was visible. Visual
  review found the product-specific cassette-zine hierarchy intact.
- Mobile Lighthouse 12.8.2 against production: **Performance 100,
  Accessibility 100, Best Practices 100, SEO 100**; FCP **0.9 s**, LCP
  **1.2 s**, TBT **0 ms**, CLS **0**. First-load transfer was **70,399 B**,
  including **11,647 B JS** and **4,441 B CSS**.
- `/opt/fleet/lib/verify-url.sh` returned HTTPS 200 in **787 ms**, with no
  browser errors, title/lang/main present, one h1, no missing image alt, and
  no unlabeled buttons.

### Privacy, billing, deployment identity, and policies

- Normal live browsing requested only `rhythm-pedal-tidy.sociobot.in`.
  Inspection found no analytics, trackers, third-party fonts/scripts,
  beacon/XHR/WebSocket paths, or performance-data uploads. Takes use IndexedDB.
- Blank license restore stayed local and explained what to do. An explicit
  invalid token made exactly one request to
  `https://api.sociobot.in/api/v1/products/rhythm-pedal-tidy/verify`, stored
  the invalid verdict, showed the inactive-license notice, and made no repeat
  API call on reload within the daily cache window. The endpoint returned
  `Cache-Control: no-store`; checkout points only to the Sociobot API. No
  payment was attempted.
- Live `/` supplies HSTS, CSP with `frame-ancestors 'none'`, MIDI-preserving
  Permissions-Policy, `X-Frame-Options: DENY`, `nosniff`, and strict-origin
  referrer policy. HTML and `sw.js` revalidate after 30 seconds; hashed JS/CSS
  are cached for one year with `immutable`.
- Local/live SHA-256 values match exactly: `index.html`
  `4bbc24b9defaf214f35c68c2c5bcb7b2934f19a524af667316c91fbea4079cb5`,
  app JS `1be08276f81859101f50fad70a1159f1803469198f0aefa41a188e10f907a810`,
  CSS `cf14750cde6ed0f1940c45e24ccdbea5bf373dd32e4a2d11f54e83444178ecc5`,
  and `sw.js` `bb498725260d160a5665e3b434e6f3980f5fc7871251c9a43780f1ca62417b6f`.
  Manifest, offline fallback, privacy, and terms also match. The live
  deployment is conclusively this candidate, not an older failed deployment.

## Scope and reproduction

No product code was modified. This is a browser PWA, not a library, CLI, or
backend, so consumer-package, server-concurrency, health, and server-side
persistence checks do not apply.

```bash
npm ci
npm test
npm run build
npm run test:e2e
```
