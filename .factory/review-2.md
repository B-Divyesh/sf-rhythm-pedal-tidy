# Adversarial first-read review 2 — Rhythm Pedal Tidy

Date: 2026-08-30

Live site: <https://rhythm-pedal-tidy.sociobot.in>

Reviewed commit: `7320596da565367905114cd8e8311a813f137f1e`

Viewports: fresh Chromium at 390×844 and 1440×1000

## Verdict: FAIL

One blocking finding and nine minor findings remain. The demo is one click
away and correctly isolated, but the first screen after that click repeats the
landing hero instead of showing the seeded take. The required verdict is FAIL
whenever any finding remains.

## Cold first screen

Before scrolling, both viewports answer the three first-read questions:

- **What does it do?** It cleans sustain-pedal MIDI overlaps without moving
  note starts. Exact text: “Clean sustain-pedal MIDI overlaps.”
- **For whom?** Keyboard and e-kit players cleaning practice takes. Exact
  text: “For keyboard and e-kit players who need clean practice takes without
  changing note starts.”
- **What should I click first?** “Try it with sample data,” followed by
  “Loads an 8-note practice take right away.”

The primary action is visible without scrolling at both sizes. No blocking
cold-landing finding applies.

## Findings

### F-2-1 — BLOCKING — The demo's first screen does not show the sample being used

**Location/quote:** live `/demo` after selecting the hero action. The viewport
shows the banner, the full marketing hero, and another “Try it with sample
data” link. The seeded workspace heading “Warm-up in C” starts at y=1,679 in
the 390×844 viewport and y=1,439 in the 1440×1000 viewport.

**Why:** The sample exists, but a first-time visitor must scroll about two
screens to see it. The first screen after the one-click demo action therefore
does not look like the product being used. Repeating the same demo action on
the demo route also suggests that the first click did not work.

**Fix:** On `/demo`, keep the persistent demo banner but replace or collapse
the landing hero so the seeded “Warm-up in C” repair summary, before/after
roll, and first useful control are visible immediately. Remove the redundant
demo link on that route. Add a 390×844 end-to-end assertion that the sample
heading and repair result intersect the initial viewport after one click.

### F-2-2 — Minor — The tempo-range sentence is an unlisted quantitative claim

**Location/quote:** demo tempo guidance: “Start is 30–240 BPM, Finish is
100–300 BPM, and Step is 1–30 BPM.”

**Why:** `.factory/claims.json` lists tempo ramping, but neither that claim nor
its test covers all six advertised range boundaries. A visitor can rely on
these numbers, so they require a claim entry and observable boundary tests.

**Fix:** Add a `tempo-control-ranges` claim and a test that enters values at
and beyond every boundary and verifies the resulting controls and messages.
Alternatively, remove the range sentence.

### F-2-3 — Minor — The synth-preview sentence is an unlisted claim

**Location/quote:** demo tempo guidance: “Playback is a simple synth preview.”

**Why:** This describes a product behavior that no claim entry tests. Existing
replay tests establish that replay starts and advances tempo, not that it uses
the stated preview output.

**Fix:** Add a `synth-preview` claim with an AudioContext fixture that verifies
the local oscillator preview, or remove the sentence and label the replay
control without describing its sound source.

### F-2-4 — Minor — The empty state uses unexplained controller jargon

**Location/quote:** landing workspace: “We’ll find notes held open by CC64 and
show each suggested cut.”

**Why:** “CC64” requires MIDI-controller knowledge even though the product
already uses the clearer term “sustain pedal.” It adds no precision needed to
complete the action.

**Fix:** “We’ll find notes held open by the sustain pedal and show each
suggested cut.”

### F-2-5 — Minor — One take is also called a session

**Location/quote:** landing controls “Import .mid or session,” “Import MIDI or
session,” “Export session,” and “Choose a MIDI or session file”; README:
“Exports cleaned MIDI and restores session or all-takes JSON files.”

**Why:** The rest of the product calls one recorded or imported performance a
“take.” “Session” appears to mean the same single-take JSON file, forcing a
visitor to infer a distinction that does not exist.

**Fix:** Use “take” everywhere: “Import MIDI or take file,” “Export take,”
“Choose a MIDI or take file,” and “Exports cleaned MIDI and restores one take
or all takes from JSON.”

### F-2-6 — Minor — “SIDE A / READY” is decorative cassette lore

**Location/quote:** empty workspace label: “SIDE A / READY.”

**Why:** It does not name the empty state or tell the visitor what is ready.
The cassette metaphor requires interpretation and duplicates the clear
heading “Bring in a pedal take.”

**Fix:** Delete the label, or replace it with the literal state “No take
loaded.”

### F-2-7 — Minor — “Take shelf” is a metaphorical section heading

**Location/quote:** landing and demo h2: “Take shelf.” README: “real take
shelf.”

**Why:** A heading should name the content without relying on the visual
theme. This section is a list of locally saved takes, not a shelf.

**Fix:** Use “Saved takes” for the h2 and “saved takes” in the README and demo
copy.

### F-2-8 — Minor — The result label uses “tangle” instead of the measured item

**Location/quote:** demo statistic: “2.74s tangle removed.”

**Why:** “Tangle” is a metaphor. The product measures removed repeated-note
overlap, so the label obscures what 2.74 seconds represents.

**Fix:** “2.74s overlap removed.”

### F-2-9 — Minor — The export heading is a mood line with unexplained jargon

**Location/quote:** demo export bar: “Ready for your DAW.”

**Why:** It does not name the section or action, and “DAW” is avoidable jargon.
The adjacent buttons already perform concrete exports.

**Fix:** “Export the cleaned take.”

### F-2-10 — Minor — The acceptance message includes non-informational praise

**Location/quote:** after selecting **Accept cleanup**: “Cleanup accepted.
Nice take.”

**Why:** “Cleanup accepted” confirms the result. “Nice take” does not tell the
visitor what changed and could apply unchanged to another music product.

**Fix:** Use “Cleanup accepted.” If persistence needs emphasis, use “Cleanup
accepted and saved with this take.”

## Copy audit

Counts use visible whitespace-separated words. The landing inventory covers
the initial empty workspace plus the seeded demo state reached from it.
Interface headings and actions are audited separately below. No sentence
exceeds 22 words, and no banned marketing adjective appears.

### Landing-page sentence inventory

| Sentence | Words | Result |
| --- | ---: | --- |
| Clean sustain-pedal MIDI overlaps. | 4 | Pass |
| For keyboard and e-kit players who need clean practice takes without changing note starts. | 14 | Pass |
| Loads an 8-note practice take right away. | 7 | Pass |
| Your MIDI stays on this device. | 6 | Pass; `local-processing` |
| Works offline after the first visit. | 6 | Pass; `offline-reload` |
| Export cleaned MIDI free. | 4 | Pass; `midi-export`, `no-checkout` |
| Import a Standard MIDI type 0 or 1 file. | 9 | Pass; `standard-midi-import` |
| We’ll find notes held open by CC64 and show each suggested cut. | 12 | **F-2-4** |
| Use .mid import when live Web MIDI is not available in your browser. | 13 | Pass |
| Your first take will appear here and survive refreshes. | 9 | Pass; `saved-take-history` |
| Back up every locally saved take in one portable JSON file. | 11 | Pass; `json-data-roundtrip` |
| Bring in your own MIDI. | 5 | Pass |
| Import a type 0 or 1 MIDI file, or connect a compatible MIDI input. | 14 | Pass; import/input claims |
| Review the repair before export. | 5 | Pass |
| No account, payment, analytics, or performance-data upload is used in this build. | 12 | Pass; privacy/no-checkout claims |
| All available controls are ready to use. | 7 | Pass; `no-checkout` |
| Read the privacy page to see what stays on your device. | 11 | Pass |
| Clean sustain-pedal overlaps on this device. | 6 | Pass |
| Built by Param Factory · v1.0.2 | 6 | Pass |
| Rhythm Pedal Tidy workspace loaded. | 5 | Pass; route announcement |
| Demo — sample data, nothing is saved to your real takes. | 11 | Pass; `demo-isolation` |
| Demo loaded. | 2 | Pass |
| The sample stays separate from your real takes. | 8 | Pass; `demo-isolation` |
| 7 note releases extended to pedal-up. | 6 | Pass; result state |
| Repeated pitches are then cut at the next strike; timing and velocity stay untouched. | 14 | Pass; `pedal-overlap-repair` |
| Does this repair look right? | 5 | Pass |
| Accepting helps you track whether the pass needed manual work. | 10 | Pass; acceptance/history behavior |
| Score measures note starts against the nearest sixteenth-note pulse. | 9 | Pass; `timing-score` |
| It is feedback, not a judgment of feel. | 8 | Pass; useful limitation |
| Start is 30–240 BPM, Finish is 100–300 BPM, and Step is 1–30 BPM. | 13 | **F-2-2** |
| Each completed replay adds 5 BPM, up to 120. | 9 | Pass; `tempo-ramp` |
| Playback is a simple synth preview. | 6 | **F-2-3** |
| Pedal sustain is baked into clean note lengths. | 8 | Pass; `pedal-overlap-repair` |
| Demo route loaded. | 3 | Pass; route announcement |
| Cleanup accepted. | 2 | Pass |
| Nice take. | 2 | **F-2-10** |

### README sentence inventory

| Sentence or list item | Words | Result |
| --- | ---: | --- |
| Rhythm Pedal Tidy cleans sustain-pedal MIDI overlaps for keyboard and e-kit players. | 12 | Pass |
| Import or record a practice take. | 6 | Pass |
| Compare the repair, replay it with a tempo ramp, and export clean MIDI. | 13 | Pass |
| Open https://rhythm-pedal-tidy.sociobot.in/demo or select Try it with sample data on the first screen. | 13 | Pass |
| The demo loads an eight-note practice take in separate sample storage. | 11 | Pass |
| Reset demo restores the sample. | 5 | Pass |
| Start for real clears the demo and returns to your real take shelf. | 13 | **F-2-7** |
| See .factory/demo.md. | 2 | Pass |
| Imports Standard MIDI type 0/1 files and records compatible live Web MIDI input after browser permission | 16 | Pass |
| It extends notes held by the sustain pedal, then cuts a repeated note at the next strike. | 17 | Pass |
| It never moves note starts. | 5 | Pass |
| Scores note starts against a sixteenth-note grid and offers a replay tempo ramp | 13 | Pass |
| Exports cleaned MIDI and restores session or all-takes JSON files | 10 | **F-2-5** |
| Saves take history and cleanup choices on this device | 9 | Pass |
| Reloads the cached demo offline, where replay and MIDI export remain usable | 12 | Pass |
| MIDI performance data is processed on the device. | 8 | Pass |
| This build has no analytics, tracking, payment, checkout, account, or remote license verification. | 13 | Pass |
| Requires Node.js 20 or newer. | 5 | Pass |
| Vite prints the local URL. | 5 | Pass |
| Web MIDI requires a secure context; Chromium treats localhost as secure. | 11 | Pass |
| Use .mid import when a browser does not provide Web MIDI. | 11 | Pass |
| Run the claim checks listed in .factory/claims.json, for example: | 9 | Pass |
| Every exact claim command runs its required production build after npm ci. | 12 | Pass |
| The production build is npm run build. | 7 | Pass |
| It writes a static PWA to dist/, with dist/index.html at its root. | 12 | Pass |
| Preview it with npm run preview. | 6 | Pass |
| Read the in-product privacy policy and terms. | 7 | Pass |
| The app has no third-party fonts or runtime scripts. | 9 | Pass |
| The only normal browser requests are to this static product origin. | 11 | Pass |
| Deploy dist/ as a static site using the supplied Static Web Apps response policy. | 14 | Pass |
| It rewrites /demo to the app and sends unknown URLs to the styled 404 response. | 15 | Pass |
| DNS, billing registration, and infrastructure are managed by the factory and are intentionally outside this repository. | 16 | Pass |
| No checkout ships in this build, so all available controls are free. | 12 | Pass |
| The cassette-era zine system and original artwork provenance are in .factory/design.md. | 11 | Pass; maintainer reference |
| Source is MIT licensed; see LICENSE. | 6 | Pass |

### Headings, labels, terminology, and actions

- Clear headings/labels: “MIDI cleanup for practice takes,” “Clean
  sustain-pedal MIDI overlaps,” “Capture → inspect → export,” “Load the take,”
  “Bring in a pedal take,” “Pedal-aware repair,” “3 clean cuts suggested,”
  “Timing score,” “Practice replay,” “Tempo ramp,” and “Bring in your own
  MIDI.”
- Flagged headings/labels: “SIDE A / READY” (**F-2-6**), “Take shelf”
  (**F-2-7**), “2.74s tangle removed” (**F-2-8**), and “Ready for your DAW”
  (**F-2-9**).
- “Session” conflicts with the established term “take” in four controls, one
  accessible file-input name, and the README (**F-2-5**).
- All action labels contain a verb and identify a result or required state:
  **Try it with sample data**, **Import MIDI or session**, **Connect live
  MIDI**, **Export all data**, **Import backup**, **Read privacy**, **Reset
  demo**, **Start for real**, **Remove take**, **Accept cleanup**, **Replay
  clean take**, **Reset tempo**, **Export cleaned MIDI**, **Export session**,
  and **Update now**. The two “session” labels still inherit **F-2-5**.
- README headings are understandable out of context. No heading uses a banned
  marketing adjective.

The canonical terminology should be: **take** for one performance, **saved
takes** for the local collection, **repair** for the proposed note changes,
**overlap** for the repeated-pitch collision, and **sample data** for the demo.

## Demo and sandbox behavior

- The hero action reaches `/demo` in one click and seeds the realistic
  eight-note **Warm-up in C** take with two pedal presses and three overlaps.
- The banner “Demo — sample data, nothing is saved to your real takes,” Reset
  demo, and Start for real remain present.
- Isolation was checked with a pre-existing real take. Accepting the sample
  changed only `demo:rhythm-pedal-tidy`; the real `rhythm-pedal-tidy` record
  remained unaccepted. Reset restored the demo sample without changing the
  real record. Start for real emptied the demo database and returned to the
  unchanged real take.
- Every request during landing, demo entry, acceptance, reset, and exit was
  same-origin. No analytics, external script, font, or API request appeared.
- A live service-worker-controlled demo reloaded while offline, retained the
  sample, and exported `warm-up-in-c-tidy.mid` with the `MThd` header.
- F-2-1 remains blocking because correct seed data below the fold does not
  satisfy the required first demo screen.

## Claims verification

Fresh clone: `/tmp/rpt-review2-s4Us3G/repo` at
`7320596da565367905114cd8e8311a813f137f1e`. After `npm ci`, every exact command
from `.factory/claims.json` ran separately.

| Claim id | Result | Observable evidence |
| --- | --- | --- |
| `demo-isolation` | PASS | Real/demo IndexedDB separation, Reset, and Start for real assertions passed. |
| `pedal-overlap-repair` | PASS | Sample cuts and exact held-pedal note boundaries, starts, and velocities passed. |
| `standard-midi-import` | PASS | Generated type 0 and type 1 fixtures each produced a visible note. |
| `live-midi-input` | PASS | Deterministic Web MIDI note and CC64 input produced the captured take. |
| `timing-score` | PASS | Score 92, mean offset 9 ms, and eight on-grid notes passed. |
| `tempo-ramp` | PASS | A 240 BPM replay advanced to 245 BPM by the selected step. |
| `midi-export` | PASS | Download name and `MThd` header passed. |
| `json-data-roundtrip` | PASS | Session and all-takes exports restored the sample. |
| `saved-take-history` | PASS | Acceptance survived reload and deletion cleared IndexedDB. |
| `offline-reload` | PASS | Dedicated offline context reloaded, replayed, and exported MIDI. |
| `local-processing` | PASS | Demo cleanup made only same-origin requests. |
| `no-checkout` | PASS | No account/billing action or feature gate appeared. |

Each declared id occurs on exactly one tagged test. No declared claim test is
untested or failing. F-2-2 and F-2-3 are live claim-like sentences absent from
the registry.

## Earlier finding verification

Every earlier review, polish record, and handoff was read. The six findings
from review 1 are genuinely fixed in both the current source and the deployed
site; none is reopened.

| Earlier id | Live confirmation | Code confirmation | Status |
| --- | --- | --- | --- |
| F-1-1 | The artwork-provenance sentence is absent on `/`, `/demo`, `/privacy/`, `/terms/`, and `/404.html`. | No match in `src`, `public`, `index.html`, or README. | Fixed |
| F-1-2 | `/`, `/demo`, Back, legal pages, and 404 focus their h1 and announce the route. | Focus logic and the Demo/Back regression test remain present. | Fixed |
| F-1-3 | The current README uses two sentences of 6 and 13 words. | The split wording is present. | Fixed |
| F-1-4 | The README uses separate Reset and Start for real sentences of 5 and 13 words. | The replacement wording is present. | Fixed |
| F-1-5 | The README describes the sustain-pedal repair in 17- and 5-word sentences. | The old 23-word CC64 sentence is absent from README. | Fixed |
| F-1-6 | The README says “separate sample storage.” | The IndexedDB namespace remains only in technical demo/privacy documentation. | Fixed |

F-2-4 is new: review 1 repaired README jargon but did not identify the separate
live empty-state CC64 sentence.

## Structure, accessibility, and visual identity

- `/`, `/demo`, `/privacy/`, `/terms/`, and `/404.html` have route-specific
  title patterns, descriptions, canonicals, Open Graph/Twitter metadata,
  favicon and Apple icon, `lang="en"`, one h1, one main, and shared
  header/footer identity. Titles are under 60 characters.
- An unknown URL returns HTTP 404 with the designed cassette-zine page and a
  route back. `/demo` deep-links directly; workspace/take anchors resolve;
  Demo and browser Back restore h1 focus and announce the destination.
- All crawled internal links and assets returned 200. The GitHub source and
  license links returned 200. `robots.txt` and `sitemap.xml` are present and
  list every public route.
- The CSP, frame restriction, `nosniff`, and referrer policy arrive as response
  headers. Normal-path pages emitted no console errors and made no
  cross-origin requests.
- Live Playwright Axe checks found no serious or critical issue on the five
  designed routes. The factory URL verifier passed `/`, `/demo`, `/privacy/`,
  and `/terms/`. Keyboard route focus and reduced-motion coverage also passed
  in the full browser suite.
- The cassette-era rehearsal-zine composition, locally served risograph art,
  warm paper palette, square mechanical controls, and piano-roll treatment
  are recognizably product-specific rather than a generic SaaS template.
- Clean-clone `npm test` passed 24 tests. The complete Playwright suite passed
  34 tests. The production build passed; initial JavaScript is 12.53 kB gzip.

## Missed leverage and AI check

No missing high-value feature is implied by the brief. The tool already
supports live MIDI, Standard MIDI import/export, one-take JSON, all-takes
backup/restore, offline replay, and local history. Cloud sync would weaken the
local-first privacy promise, and deterministic MIDI overlap repair does not
benefit from a model call. No runtime AI feature, provider key, Azure endpoint,
or Sociobot gateway call is shipped.

## What would make this perfect

Make `/demo` open on a genuinely in-use sample viewport and add the viewport
regression test. Register and test the two unlisted behavior claims, or remove
their sentences. Replace CC64, session/take inconsistency, cassette lore,
metaphorical labels, DAW jargon, and non-informational praise with the exact
plain-language rewrites above. Then rerun all 12 claim commands, the complete
test suites, live request/offline checks, the copy inventory, and the route
crawl. Zero remaining findings is the acceptance threshold.
