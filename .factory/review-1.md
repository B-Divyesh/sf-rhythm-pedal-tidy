# Adversarial first-read review 1 — Rhythm Pedal Tidy

Date: 2026-08-30. Live: <https://rhythm-pedal-tidy.sociobot.in>. Fresh Chromium: 390×844 and 1440×1000.

## Verdict: FAIL

No blocking finding was observed. Six minor findings remain; the required PASS standard is zero findings.

## Cold first screen

Before scrolling on both viewports: it cleans MIDI note overlaps caused by a sustain pedal; it is for keyboard and e-kit players cleaning practice takes; click **Try it with sample data**, which says it loads an eight-note practice take right away. The task, audience, and first action are all visible. No blocking cold-screen finding.

## Findings

### F-1-1 — Minor — Decorative, unlisted AI/artwork claim

**Location/quote:** shared footer on `/`, `/demo`, `/privacy/`, `/terms/`, and `/404.html`: “Original AI-assisted risograph artwork.”

**Why:** This is an asset-provenance claim, not useful product guidance. It is also the only claim-like landing sentence without a `.factory/claims.json` entry. It violates the plain-words prohibition on decorative AI/brand-lore copy.

**Fix:** Remove it from the public footer. Keep provenance in `.factory/design.md`; if retained publicly, explain its visitor benefit and add a reproducible provenance check.

### F-1-2 — Minor — Navigation does not focus the destination h1

**Location/evidence:** From fresh live `/`, click **Demo**. At `/demo`, `document.activeElement` is `H2#take-title` (“Warm-up in C”), not the h1 (“Clean sustain-pedal MIDI overlaps.”). Direct `/demo` load produces the same focus result.

**Why:** Route behavior must announce the route and move focus to its h1. The status line says “Demo loaded…”, but does not meet the h1-focus requirement.

**Fix:** Focus a temporary `tabindex="-1"` on the route h1 after every route entry and history navigation, retaining the polite announcement. Add an end-to-end click-Demo/Back test that asserts the current h1 has focus.

### F-1-3 — Minor — README opening workflow sentence is too long

**Location/quote:** README introduction: “Import or record a practice take, compare the pedal-aware repair, replay it with a tempo ramp, and export a clean Standard MIDI file.” (23 words)

**Why:** It exceeds the 22-word hard cap and chains four actions into one breath at the decision point.

**Fix:** “Import or record a practice take. Compare the repair, replay it with a tempo ramp, and export clean MIDI.”

### F-1-4 — Minor — README demo explanation is too long

**Location/quote:** README, **Try the demo**: “Its banner lets you reset the sample or start for real; starting for real clears the demo database and returns to the separate real take shelf.” (26 words)

**Why:** The discard behavior is buried inside a long, technical sentence.

**Fix:** “Reset demo restores the sample. Start for real clears the demo and returns to your real take shelf.”

### F-1-5 — Minor — README controller jargon is unexplained and too long

**Location/quote:** README, **What it does**: “Expands CC64 sustain through pedal-up or the captured take boundary, then trims a repeated pitch at the next strike without moving note starts.” (23 words)

**Why:** “CC64” and “pedal-up” are unexplained controller jargon, and the sentence exceeds the 22-word cap.

**Fix:** “It extends notes held by the sustain pedal, then cuts a repeated note at the next strike. It never moves note starts.”

### F-1-6 — Minor — README exposes storage implementation jargon in the demo path

**Location/quote:** README, **Try the demo**: “The demo loads an eight-note practice take into the `demo:rhythm-pedal-tidy` IndexedDB database.”

**Why:** The storage key and “IndexedDB” are implementation details, not first-read guidance for trying the product.

**Fix:** “The demo loads an eight-note practice take in separate sample storage.” Put the precise namespace in `.factory/demo.md` and the privacy policy.

## Copy audit

Counts use visible whitespace-separated words. All sentence-level default landing and first-demo content is below; labels/buttons are included where they carry instruction. No landing sentence exceeds 22 words.

| Copy | Words | Result |
| --- | ---: | --- |
| MIDI cleanup for practice takes | 5 | clear context label |
| Clean sustain-pedal MIDI overlaps. | 4 | pass |
| For keyboard and e-kit players who need clean practice takes without changing note starts. | 14 | pass |
| Try it with sample data | 5 | result-naming action |
| Loads an 8-note practice take right away. | 7 | pass |
| Your MIDI stays on this device. | 6 | declared local-processing claim |
| Works offline after the first visit. | 6 | declared offline claim |
| Export cleaned MIDI free. | 4 | declared export/no-checkout claim |
| Capture → inspect → export | 3 | useful process label |
| Load the take | 3 | clear heading |
| Import .mid or session | 4 | result-naming action |
| Connect live MIDI | 3 | clear action |
| Bring in a pedal take | 5 | clear empty-state heading |
| Import a Standard MIDI type 0 or 1 file. | 9 | declared import claim |
| We’ll find notes held open by CC64 and show each suggested cut. | 12 | pass |
| Import MIDI or session | 4 | result-naming action |
| Use .mid import when live Web MIDI is not available in your browser. | 13 | useful fallback |
| Take shelf | 2 | clear heading |
| Your first take will appear here and survive refreshes. | 9 | declared history claim |
| Back up every locally saved take in one portable JSON file. | 11 | declared JSON claim |
| Export all data | 3 | result-naming action |
| Import backup | 2 | result-naming action |
| Bring in your own MIDI. | 5 | clear heading |
| Import a type 0 or 1 MIDI file, or connect a compatible MIDI input. | 14 | declared input claims |
| Review the repair before export. | 6 | useful instruction |
| No account, payment, analytics, or performance-data upload is used in this build. | 12 | declared privacy/no-checkout claims |
| All available controls are ready to use. | 8 | declared no-checkout claim |
| Read the privacy page to see what stays on your device. | 11 | useful action |
| Clean sustain-pedal overlaps on this device. | 6 | clear footer line |
| Built by Param Factory · v1.0.1 | 5 | build identity |
| Original AI-assisted risograph artwork. | 4 | **F-1-1** |
| Demo — sample data, nothing is saved to your real takes. | 10 | declared demo-isolation claim |
| Reset demo | 2 | clear action |
| Start for real | 3 | clear action |
| 3 clean cuts suggested | 4 | useful sample result |
| 7 note releases extended to pedal-up. | 6 | useful sample result |
| Repeated pitches are then cut at the next strike; timing and velocity stay untouched. | 14 | declared repair claim |
| Does this repair look right? | 5 | clear decision prompt |
| Accepting helps you track whether the pass needed manual work. | 10 | useful explanation |
| Timing score | 2 | clear heading |
| Score measures note starts against the nearest sixteenth-note pulse. | 10 | declared timing claim |
| It is feedback, not a judgment of feel. | 8 | useful limitation |
| Tempo ramp | 2 | clear heading |
| Start is 30–240 BPM, Finish is 100–300 BPM, and Step is 1–30 BPM. | 13 | useful control guidance |
| Each completed replay adds 5 BPM, up to 120. | 9 | declared tempo claim |
| Playback is a simple synth preview. | 6 | useful limitation |
| Ready for your DAW | 4 | clear export context |
| Pedal sustain is baked into clean note lengths. | 8 | useful export explanation |
| Export cleaned MIDI | 3 | result-naming action |
| Export session | 2 | result-naming action |

### README sentence inventory

| Sentence or list item | Words | Result |
| --- | ---: | --- |
| Rhythm Pedal Tidy cleans sustain-pedal MIDI overlaps for keyboard and e-kit players. | 12 | pass |
| Import or record a practice take, compare the pedal-aware repair, replay it with a tempo ramp, and export a clean Standard MIDI file. | 23 | **F-1-3** |
| Open https://rhythm-pedal-tidy.sociobot.in/demo or select Try it with sample data on the first screen. | 14 | pass |
| The demo loads an eight-note practice take into the `demo:rhythm-pedal-tidy` IndexedDB database. | 13 | **F-1-6** |
| Its banner lets you reset the sample or start for real; starting for real clears the demo database and returns to the separate real take shelf. | 26 | **F-1-4** |
| Imports Standard MIDI type 0/1 files and records compatible live Web MIDI input after browser permission. | 16 | pass |
| Expands CC64 sustain through pedal-up or the captured take boundary, then trims a repeated pitch at the next strike without moving note starts. | 23 | **F-1-5** |
| Scores note starts against a sixteenth-note grid and offers a replay tempo ramp. | 13 | pass |
| Exports cleaned MIDI and restores session or all-takes JSON files. | 10 | pass |
| Stores take history and cleanup acceptance in local IndexedDB. | 9 | technical feature detail |
| Reloads the cached demo offline, where replay and MIDI export remain usable. | 12 | pass |
| MIDI performance data is processed on the device. | 8 | declared claim |
| This build has no analytics, tracking, payment, checkout, account, or remote license verification. | 13 | declared claims |
| Requires Node.js 20 or newer. | 5 | developer setup |
| Vite prints the local URL. | 5 | developer setup |
| Web MIDI requires a secure context; Chromium treats localhost as secure. | 11 | developer setup |
| Use .mid import when a browser does not provide Web MIDI. | 11 | pass |
| Run the claim checks listed in .factory/claims.json, for example: | 9 | developer instruction |
| Every exact claim command runs its required production build after npm ci. | 12 | developer instruction |
| The production build is npm run build. | 7 | developer instruction |
| It writes a static PWA to dist/, with dist/index.html at its root. | 12 | developer instruction |
| Preview it with npm run preview. | 6 | developer instruction |
| Read the in-product privacy policy and terms. | 7 | useful action |
| The app has no third-party fonts or runtime scripts. | 9 | declared claim |
| The only normal browser requests are to this static product origin. | 11 | declared claim |
| Deploy dist/ as a static site using the supplied Static Web Apps response policy. | 14 | developer instruction |
| It rewrites /demo to the app and sends unknown URLs to the styled 404 response. | 15 | developer instruction |
| DNS, billing registration, and infrastructure are managed by the factory and are intentionally outside this repository. | 16 | scope statement |
| No checkout ships in this build, so all available controls are free. | 12 | declared no-checkout claim |
| The cassette-era zine system and original artwork provenance are in .factory/design.md. | 11 | maintainer reference |
| Source is MIT licensed; see LICENSE. | 6 | repository reference |

Terminology is otherwise consistent: **take** is a recorded/imported performance; **repair** is the pedal-aware edit; **overlap** is a repeated-pitch collision; **sample data** is shipped demo material; and **take shelf** is the saved collection.

## Demo, claims, privacy, and history

- The one-click hero action entered `/demo`, immediately showed **Warm-up in C** with eight notes and three suggested cuts, and showed the persistent banner with Reset demo and Start for real.
- In a fresh context, real IndexedDB `rhythm-pedal-tidy` was empty while `demo:rhythm-pedal-tidy` contained only **Warm-up in C**. Reset restored sample state. Start for real cleared demo storage and returned to the empty real workspace.
- Request logging across landing → demo → reset → start-for-real contained only the product origin. The live normal path produced no console errors.
- Every one of the 12 exact commands in `.factory/claims.json` passed after `npm ci`. No declared claim failed. Workflow/privacy claims map to those entries except F-1-1.
- No `.factory/review-*.md` or `.factory/polish-*.md` existed. The previous `.factory/handoff.md` was read; its demo, claim, and privacy results reproduce. It contains no earlier finding to reopen.

## Structure and technical checks

- `/`, `/demo`, `/privacy/`, `/terms/`, `/404.html`, the social card, and linked GitHub source returned HTTP 200. An unknown live route returned the designed HTTP 404.
- Checked routes have route-specific titles, descriptions, canonicals, Open Graph/Twitter metadata, favicon/apple icon, one h1, main landmark, and common header/footer with Privacy and Terms. The CSP is a response header.
- The cold page is a distinct cassette-era rehearsal-zine identity, not a generic SaaS template, and matches `.factory/design.md`.
- `npm test` passed (22 tests). `npm run build` passed and produced `dist/`. Production JavaScript is 12.43 kB gzip. F-1-2 is the remaining route/focus exception.
- The brief does not imply a missing AI step, sync, or import/export path: MIDI import/export, JSON backup/restore, and live MIDI input are present. No runtime provider key or decorative AI feature was found.

## What would make this perfect

Remove the footer sentence, focus h1 on all route entries/back navigation, and apply the four README rewrites. Then rerun the route test, copy audit, all claim commands, `npm test`, and `npm run build`.
