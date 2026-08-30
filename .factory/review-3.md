# Adversarial first-read review 3 — Rhythm Pedal Tidy

Date: 2026-08-30

Live site: <https://rhythm-pedal-tidy.sociobot.in>

Reviewed commit: `a0ec0608656dee140e89cbe944547b0fa037f5b5`

Viewports: fresh Chromium at 390×844 and 1440×1000

## Verdict: FAIL

One blocking finding and six minor findings remain. The core workflow, demo,
privacy boundary, declared claims, routing, and accessibility checks pass, but
the required verdict is FAIL whenever any finding remains.

## Cold first screen

Before scrolling, both viewports answer the three first-read questions:

- **What does it do?** It cleans sustain-pedal MIDI overlaps without moving
  note starts. Exact text: “Clean sustain-pedal MIDI overlaps.”
- **For whom?** Keyboard and e-kit players cleaning practice takes. Exact
  text: “For keyboard and e-kit players who need clean practice takes without
  changing note starts.”
- **What should I click first?** “Try it with sample data,” followed by
  “Loads an 8-note practice take right away.”

The headline, audience sentence, primary action, action result, and all three
privacy/offline/price facts fit within both initial viewports. The mobile page
has no horizontal overflow. No blocking cold-first-screen finding applies.

## Findings

### F-3-1 — BLOCKING — The earlier immutable-cache defect remains unfixed

**Earlier location/quote:** the verification-8 `.factory/handoff.md` at the
base commit: “the deployment policy gives unhashed image assets under
`/assets/*` one-year immutable caching.”

**Current evidence:** `public/staticwebapp.config.json` still assigns
`Cache-Control: public, max-age=31536000, immutable` to every `/assets/*`
response. The live stable URLs `/assets/pedal-tape-hero.avif`,
`/assets/pedal-tape-hero-720.webp`, and `/assets/social-card.jpg` return that
header.

**Why:** These filenames do not contain content hashes. A returning visitor or
social-card fetcher can retain an obsolete image for a year after a future
release replaces the file. This round requires every unfixed earlier finding
or recorded defect to be reopened as blocking.

**Fix:** Put a content hash in every shipped image filename and update the
HTML, service-worker shell list, metadata, and tests. Keep the one-year
immutable rule only for hashed assets. Alternatively, give stable image names
a short revalidating cache policy. Add a deployment-header test that rejects
`immutable` for unhashed asset names.

### F-3-2 — Minor — “pedal-up” is unexplained shorthand

**Location/quote:** first demo result explanation: “7 note releases extended
to pedal-up.”

**Why:** “Pedal-up” makes the visitor translate controller-state shorthand.
The product otherwise uses the clearer term “sustain pedal.”

**Fix:** “7 note releases extended while the sustain pedal was held.”

### F-3-3 — Minor — The export explanation uses a metaphor

**Location/quote:** demo export bar: “Pedal sustain is baked into clean note
lengths.”

**Why:** “Baked into” describes neither the edit nor the exported result
literally. It violates the plain-words rule against metaphor.

**Fix:** “The cleaned note lengths include the sustain-pedal holds.”

### F-3-4 — Minor — The 404 page retains decorative cassette lore

**Location/quote:** `/404.html` label: “404 / END OF TAPE.”

**Why:** “End of tape” is a theme-specific metaphor that adds no recovery
information. The clear h1 already says “This page is not here.”

**Fix:** Use “404 / PAGE NOT FOUND” or remove the label. Keep the visual
treatment without metaphorical copy.

### F-3-5 — Minor — External links do not name their external destination

**Location/quote:** the shared footer link “Source,” Privacy link “public
source repository,” and Terms link “MIT License.” Each goes to `github.com`
without visible or accessible external-destination text.

**Why:** A visitor cannot tell before activation that these links leave the
product. The site-structure requirement says external links must say so.

**Fix:** Use “Source on GitHub,” “public source repository on GitHub,” and
“MIT License on GitHub,” or add equivalent accessible text. Apply the footer
change on the app, Privacy, Terms, 404, and offline pages.

### F-3-6 — Minor — The live AVIF asset has the wrong MIME type

**Location/evidence:** `GET /assets/pedal-tape-hero.avif` returns
`Content-Type: application/octet-stream` together with
`X-Content-Type-Options: nosniff`.

**Why:** The response does not identify the file as AVIF. Chromium displayed
it in this review, but incorrect media metadata can prevent consistent image
handling by other browsers, proxies, or preview clients.

**Fix:** Configure `.avif` as `image/avif` in the static-host policy. Add a
deployed response-header assertion for the hero AVIF.

### F-3-7 — Minor — Offline reload logs a failed network request

**Location/evidence:** after caching `/demo`, switching the browser context
offline, and reloading, the console logs “Failed to load resource:
net::ERR_INTERNET_DISCONNECTED.” The request comes from the unconditional
`HEAD /robots.txt?online=…` probe in `src/main.ts`.

**Why:** The offline feature works, but the product contract requires no
console errors on load. An intentional offline reload should not start a
network probe that is already known to fail.

**Fix:** When `navigator.onLine` is false, set the offline state without the
probe. Add an offline-reload assertion that captures console errors and
expects none.

## Copy audit

Counts use visible words and exclude standalone punctuation. The landing
inventory covers the cold empty workspace and the fully loaded first demo
state. Repeated shared sentences are listed once. No sentence exceeds 22
words, and no banned marketing adjective appears.

### Landing-page sentences and list statements

| Exact copy | Words | Result |
| --- | ---: | --- |
| Clean sustain-pedal MIDI overlaps. | 4 | Pass |
| For keyboard and e-kit players who need clean practice takes without changing note starts. | 14 | Pass |
| Loads an 8-note practice take right away. | 7 | Pass |
| Your MIDI stays on this device. | 6 | Pass; `local-processing` |
| Works offline after the first visit. | 6 | Pass; `offline-reload` |
| Export cleaned MIDI free. | 4 | Pass; `midi-export`, `no-checkout` |
| Import a Standard MIDI type 0 or 1 file. | 9 | Pass; `standard-midi-import` |
| We’ll find notes held open by the sustain pedal and show each suggested cut. | 14 | Pass; `pedal-overlap-repair` |
| Use .mid import when live Web MIDI is not available in your browser. | 13 | Pass; useful fallback |
| Your first take will appear here and survive refreshes. | 9 | Pass; `saved-take-history` |
| Back up every locally saved take in one portable JSON file. | 11 | Pass; `json-data-roundtrip` |
| Bring in your own MIDI. | 5 | Pass |
| Import a type 0 or 1 MIDI file, or connect a compatible MIDI input. | 14 | Pass; input claims |
| Review the repair before export. | 5 | Pass |
| Local MIDI import and export | 5 | Pass; import/export claims |
| Live Web MIDI when your browser supports it | 8 | Pass; `live-midi-input` |
| Saved take history on this device | 6 | Pass; `saved-take-history` |
| No account, payment, analytics, or performance-data upload is used in this build. | 12 | Pass; privacy/no-checkout claims |
| All available controls are ready to use. | 7 | Pass; `no-checkout` |
| Read the privacy page to see what stays on your device. | 11 | Pass |
| Clean sustain-pedal overlaps on this device. | 6 | Pass; `local-processing` |
| Built by Param Factory · v1.0.3 | 5 | Pass; attribution/build id |
| Rhythm Pedal Tidy workspace loaded. | 5 | Pass; route announcement |
| Demo — sample data, nothing is saved to your real takes. | 10 | Pass; `demo-isolation` |
| 7 note releases extended to pedal-up. | 6 | **F-3-2** |
| Repeated pitches are then cut at the next strike; timing and velocity stay untouched. | 14 | Pass; `pedal-overlap-repair` |
| Does this repair look right? | 5 | Pass |
| Accepting helps you track whether the pass needed manual work. | 10 | Pass |
| Score measures note starts against the nearest sixteenth-note pulse. | 9 | Pass; `timing-score` |
| It is feedback, not a judgment of feel. | 8 | Pass; useful limitation |
| Start is 30–240 BPM, Finish is 100–300 BPM, and Step is 1–30 BPM. | 13 | Pass; `tempo-control-ranges` |
| Each completed replay adds 5 BPM, up to 120. | 9 | Pass; `tempo-ramp` |
| Pedal sustain is baked into clean note lengths. | 8 | **F-3-3** |
| Demo route loaded. | 3 | Pass; route announcement |

### README sentences and list items

| Exact copy | Words | Result |
| --- | ---: | --- |
| Rhythm Pedal Tidy cleans sustain-pedal MIDI overlaps for keyboard and e-kit players. | 12 | Pass |
| Import or record a practice take. | 6 | Pass |
| Compare the repair, replay it with a tempo ramp, and export clean MIDI. | 13 | Pass |
| Open https://rhythm-pedal-tidy.sociobot.in/?demo=1 or select Try it with sample data on the first screen. | 13 | Pass |
| The demo loads an eight-note practice take in separate sample storage. | 11 | Pass |
| Reset demo restores the sample. | 5 | Pass |
| Start for real clears the demo and returns to your saved takes. | 12 | Pass |
| See .factory/demo.md. | 2 | Pass |
| Imports Standard MIDI type 0/1 files and records compatible live Web MIDI input after browser permission | 16 | Pass |
| It extends notes held by the sustain pedal, then cuts a repeated note at the next strike. | 17 | Pass |
| It never moves note starts. | 5 | Pass |
| Scores note starts against a sixteenth-note grid and offers a replay tempo ramp | 13 | Pass |
| Exports cleaned MIDI and restores one take or all takes from JSON | 12 | Pass |
| Saves take history and cleanup choices on this device | 9 | Pass |
| Reloads the cached demo offline, where replay and MIDI export remain usable | 12 | Pass |
| MIDI performance data is processed on the device. | 8 | Pass |
| This build has no analytics, tracking, payment, checkout, account, or remote license verification. | 13 | Pass |
| Requires Node.js 20 or newer. | 5 | Pass; developer requirement |
| Vite prints the local URL. | 5 | Pass; developer instruction |
| Web MIDI requires a secure context; Chromium treats localhost as secure. | 11 | Pass; developer compatibility note |
| Use .mid import when a browser does not provide Web MIDI. | 11 | Pass; fallback |
| Run the claim checks listed in .factory/claims.json, for example: | 9 | Pass; developer instruction |
| Every exact claim command runs its required production build after npm ci. | 12 | Pass; developer instruction |
| The production build is npm run build. | 7 | Pass; developer instruction |
| It writes a static PWA to dist/, with dist/index.html at its root. | 12 | Pass; developer instruction |
| Preview it with npm run preview. | 6 | Pass; developer instruction |
| Read the in-product privacy policy and terms. | 7 | Pass |
| The app has no third-party fonts or runtime scripts. | 9 | Pass; `local-processing` |
| The only normal browser requests are to this static product origin. | 11 | Pass; `local-processing` |
| Deploy dist/ as a static site using the supplied Static Web Apps response policy. | 14 | Pass; developer instruction |
| It rewrites /demo to the app and sends unknown URLs to the styled 404 response. | 15 | Pass; verified routing |
| DNS, billing registration, and infrastructure are managed by the factory and are intentionally outside this repository. | 16 | Pass; scope statement |
| No checkout ships in this build, so all available controls are free. | 12 | Pass; `no-checkout` |
| The cassette-era zine system and original artwork provenance are in .factory/design.md. | 11 | Pass; maintainer reference |
| Source is MIT licensed; see LICENSE. | 6 | Pass |

### Headings, terminology, actions, and links

- Clear headings/labels include “MIDI cleanup for practice takes,” “Capture →
  inspect → export,” “Load the take,” “No take loaded,” “Bring in a pedal
  take,” “Saved takes,” “Sample take,” “Warm-up in C,” “Pedal-aware repair,”
  “3 clean cuts suggested,” “Timing score,” “Practice replay,” “Tempo ramp,”
  and “Export the cleaned take.” The 404 label is the exception in **F-3-4**.
- The canonical terms remain consistent: **take**, **saved takes**, **repair**,
  **overlap**, **sample data**, and **demo**. “Pedal-up” is the jargon exception
  in **F-3-2**.
- Result-naming actions pass: **Try it with sample data**, **Import MIDI or
  take file**, **Connect live MIDI**, **Export all data**, **Import backup**,
  **Read privacy**, **Reset demo**, **Start for real**, **Remove take**,
  **Accept cleanup**, **Replay clean take**, **Reset tempo**, **Export cleaned
  MIDI**, and **Export take**.
- Internal navigation labels name their destinations. External-destination
  disclosure fails as recorded in **F-3-5**.

## Demo and sandbox behavior

- The hero action enters `/?demo=1` in one click. At 390×844 and scroll
  position zero, **Warm-up in C**, eight notes, two pedal presses, three
  overlaps, the before/after roll, and **Accept cleanup** are all in the first
  viewport. The marketing hero and duplicate demo action are absent.
- The persistent banner says “Demo — sample data, nothing is saved to your
  real takes” and provides Reset demo and Start for real.
- A real control take was created before entering the live demo. Accepting the
  sample changed only `demo:rhythm-pedal-tidy`; the real take remained
  unaccepted. Reset restored the unaccepted sample and left the real take
  unchanged. Start for real cleared the demo database and restored the real
  take.
- All 14 observed requests in the full live demo flow were same-origin. No
  analytics, external script, font, API, or model request occurred.
- The cached live demo reloaded offline, retained the sample, replayed it, and
  exported a 105-byte Standard MIDI file with an `MThd` header. **F-3-7**
  records the one console-level network error during that intentional offline
  reload.

## Claims verification

Fresh clone: `/tmp/rhythm-pedal-tidy-review3.amhZNo/repo` at
`a0ec0608656dee140e89cbe944547b0fa037f5b5`. `npm ci` completed with zero
reported vulnerabilities. Every exact command in `.factory/claims.json` ran
separately.

| Claim id | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | Real/demo databases, Reset demo, and Start for real passed. |
| `pedal-overlap-repair` | PASS | Sample cuts and exact held-pedal note boundaries, starts, and velocities passed. |
| `standard-midi-import` | PASS | Generated type 0 and type 1 MIDI fixtures each produced the expected note. |
| `live-midi-input` | PASS | Deterministic Web MIDI note and sustain messages produced a captured take. |
| `timing-score` | PASS | Score 92, mean offset 9 ms, and eight on-grid notes passed. |
| `tempo-ramp` | PASS | Replay advanced from 240 to 245 BPM by the selected step. |
| `tempo-control-ranges` | PASS | All six published boundaries and out-of-range corrections passed. |
| `midi-export` | PASS | Filename and Standard MIDI `MThd` header passed. |
| `json-data-roundtrip` | PASS | One-take and all-takes exports restored the sample. |
| `saved-take-history` | PASS | Acceptance survived reload; deletion cleared the saved record. |
| `offline-reload` | PASS | Dedicated offline context reloaded, replayed, and exported MIDI. |
| `local-processing` | PASS | Demo cleanup made only product-origin requests. |
| `no-checkout` | PASS | No account/billing action or feature gate appeared. |

Each declared id has exactly one tagged test. Every claim-like sentence on the
live landing/demo experience maps to an entry above. No declared or unlisted
product claim remains untested.

## Earlier finding verification

Every earlier review, polish record, and the prior handoff was read. All 16
numbered review findings remain fixed in both deployed behavior and current
source. The unnumbered verification-8 cache defect is not fixed and is
reopened as **F-3-1**.

| Earlier id | Live and code confirmation | Status |
| --- | --- | --- |
| F-1-1 | Artwork-provenance copy is absent from all public footers and source templates. | Fixed |
| F-1-2 | Landing, Demo, Back, legal pages, and 404 focus their h1 and announce route changes. | Fixed |
| F-1-3 | README workflow remains split into 6- and 13-word sentences. | Fixed |
| F-1-4 | README Reset demo and Start for real text remains split and short. | Fixed |
| F-1-5 | README uses sustain-pedal language and no CC64 jargon. | Fixed |
| F-1-6 | README says separate sample storage and exposes no IndexedDB key. | Fixed |
| F-2-1 | The initial mobile demo viewport shows the sample result, roll, and first decision. | Fixed |
| F-2-2 | `tempo-control-ranges` exists and its exact boundary test passes. | Fixed |
| F-2-3 | “Playback is a simple synth preview” is absent from live copy and source. | Fixed |
| F-2-4 | The empty state says “sustain pedal”; public copy contains no CC64. | Fixed |
| F-2-5 | Visitor-facing “session” was replaced with “take.” | Fixed |
| F-2-6 | “SIDE A / READY” is replaced by “No take loaded.” | Fixed |
| F-2-7 | “Take shelf” is replaced by “Saved takes.” | Fixed |
| F-2-8 | The result says “overlap removed,” not “tangle removed.” | Fixed |
| F-2-9 | The export heading is “Export the cleaned take.” | Fixed |
| F-2-10 | Acceptance says “Cleanup accepted and saved with this take.” | Fixed |
| Verification-8 P3 | Stable `/assets/*` image names still receive one-year immutable caching. | **Unfixed → F-3-1** |

The clean-clone build and the live HTML, JavaScript, CSS, Privacy, Terms, 404,
and service worker files have matching SHA-256 hashes, so the code and live
checks refer to the same candidate.

## Structure, accessibility, and visual identity

- `/`, `/?demo=1`, `/demo`, `/privacy/`, `/terms/`, `/offline.html`, and the
  designed 404 have route-appropriate titles, descriptions, canonicals,
  Open Graph/Twitter metadata, favicon/apple icon, `lang="en"`, one h1, and
  one main landmark. An unknown path returns HTTP 404 with recovery links.
- Demo deep links work. Main navigation and browser Back focus the destination
  h1 and update the polite route announcement. Hash destinations exist.
- All discovered internal destinations and the two GitHub targets respond.
  **F-3-5** concerns destination disclosure, not link availability.
- The response carries CSP, frame restrictions, `nosniff`, and referrer
  policy as headers. **F-3-6** is the AVIF media-type exception.
- The factory URL verifier passes `/`, `/demo`, `/privacy/`, and `/terms/` with
  no normal-load console errors. Live Axe scans report zero violations on six
  routes at both mobile and desktop sizes. Focus rings, 44-pixel targets,
  reduced motion, keyboard replay, and mobile width checks pass. **F-3-7** is
  limited to the deliberate offline reload.
- The cassette-era rehearsal-zine art, paper palette, type, square controls,
  and piano-roll treatment match `.factory/design.md` and are distinct from a
  generic SaaS template.
- Clean-clone `npm test` passed 28 tests; `npm run check` passed; the full
  Playwright suite passed 36 tests. The production build emitted 12.63 kB of
  JavaScript gzip and produced `dist/`.

## Missed leverage and AI check

No missing high-value feature is implied by the brief. The tool already
supports live MIDI recording, Standard MIDI import/export, one-take and
all-takes JSON transfer, local history, offline replay, comparison, scoring,
and tempo practice. Cloud sync would conflict with the local-first promise.
The deterministic overlap repair does not benefit from a model call. No
runtime AI feature, provider key, Azure endpoint, or Sociobot gateway call is
present.

## What would make this perfect

Fingerprint the immutable image assets or shorten their cache lifetime; make
the two demo explanations literal; remove the 404 tape metaphor; identify
GitHub destinations; serve AVIF as `image/avif`; and avoid the known-failing
online probe during offline reload. Then rerun all 13 claim commands, the full
unit/browser suites, the live route crawl, offline console capture, Axe, and
the sentence audit. Zero remaining findings is the acceptance threshold.
