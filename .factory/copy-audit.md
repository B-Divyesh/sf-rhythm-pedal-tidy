# Copy audit

Date: 2026-08-30. Audited the production landing route, the seeded demo, and
README. Counts use visible whitespace-separated words. No sentence exceeds 22
words. No banned marketing word appears.

## Landing and empty workspace

| Visitor-facing copy | Words | Result |
| --- | ---: | --- |
| MIDI cleanup for practice takes | 5 | pass |
| Clean sustain-pedal MIDI overlaps. | 4 | pass |
| For keyboard and e-kit players who need clean practice takes without changing note starts. | 14 | pass |
| Try it with sample data | 5 | pass |
| Loads an 8-note practice take right away. | 7 | pass |
| Your MIDI stays on this device. | 6 | pass |
| Works offline after the first visit. | 6 | pass |
| Export cleaned MIDI free. | 4 | pass |
| Load the take | 3 | pass |
| Import MIDI or take file | 5 | pass |
| Connect live MIDI | 3 | pass |
| No take loaded | 3 | pass |
| Bring in a pedal take | 5 | pass |
| Import a Standard MIDI type 0 or 1 file. | 9 | pass |
| We’ll find notes held open by the sustain pedal and show each suggested cut. | 14 | pass |
| Use .mid import when live Web MIDI is not available in your browser. | 13 | pass |
| Saved takes | 2 | pass |
| Your first take will appear here and survive refreshes. | 9 | pass |
| Back up every locally saved take in one portable JSON file. | 11 | pass |
| Export all data | 3 | pass |
| Import backup | 2 | pass |
| Bring in your own MIDI. | 5 | pass |
| Import a type 0 or 1 MIDI file, or connect a compatible MIDI input. | 14 | pass |
| Review the repair before export. | 5 | pass |
| No account, payment, analytics, or performance-data upload is used in this build. | 12 | pass |
| All available controls are ready to use. | 7 | pass |
| Read the privacy page to see what stays on your device. | 11 | pass |
| Clean sustain-pedal overlaps on this device. | 6 | pass |
| Built by Param Factory · v1.0.3 | 5 | pass |

## Seeded demo

| Visitor-facing copy | Words | Result |
| --- | ---: | --- |
| Demo — sample data, nothing is saved to your real takes. | 10 | pass |
| Reset demo | 2 | pass |
| Start for real | 3 | pass |
| Sample take | 2 | pass |
| Warm-up in C | 3 | pass |
| 3 clean cuts suggested | 4 | pass |
| 2.74s overlap removed | 3 | pass |
| 7 note releases extended to pedal-up. | 6 | pass |
| Repeated pitches are then cut at the next strike; timing and velocity stay untouched. | 14 | pass |
| Does this repair look right? | 5 | pass |
| Accepting helps you track whether the pass needed manual work. | 10 | pass |
| Score measures note starts against the nearest sixteenth-note pulse. | 9 | pass |
| It is feedback, not a judgment of feel. | 8 | pass |
| Start is 30–240 BPM, Finish is 100–300 BPM, and Step is 1–30 BPM. | 13 | pass |
| Each completed replay adds 5 BPM, up to 120. | 9 | pass |
| Export the cleaned take | 4 | pass |
| Pedal sustain is baked into clean note lengths. | 8 | pass |
| Export cleaned MIDI | 3 | pass |
| Export take | 2 | pass |
| Cleanup accepted and saved with this take. | 7 | pass |

The removed sentence “Playback is a simple synth preview” is not published.
The six quantitative tempo boundaries are covered by
`@claim:tempo-control-ranges`.

## README sentence audit

| Sentence or list item | Words | Result |
| --- | ---: | --- |
| Rhythm Pedal Tidy cleans sustain-pedal MIDI overlaps for keyboard and e-kit players. | 12 | pass |
| Import or record a practice take. | 6 | pass |
| Compare the repair, replay it with a tempo ramp, and export clean MIDI. | 13 | pass |
| Open the demo URL or select Try it with sample data on the first screen. | 14 | pass |
| The demo loads an eight-note practice take in separate sample storage. | 11 | pass |
| Reset demo restores the sample. | 5 | pass |
| Start for real clears the demo and returns to your saved takes. | 12 | pass |
| Imports Standard MIDI type 0/1 files and records compatible live Web MIDI input after browser permission. | 16 | pass |
| It extends notes held by the sustain pedal, then cuts a repeated note at the next strike. | 17 | pass |
| It never moves note starts. | 5 | pass |
| Scores note starts against a sixteenth-note grid and offers a replay tempo ramp. | 13 | pass |
| Exports cleaned MIDI and restores one take or all takes from JSON. | 12 | pass |
| Saves take history and cleanup choices on this device. | 9 | pass |
| Reloads the cached demo offline, where replay and MIDI export remain usable. | 12 | pass |
| MIDI performance data is processed on the device. | 8 | pass |
| This build has no analytics, tracking, payment, checkout, account, or remote license verification. | 13 | pass |

Developer setup and deployment instructions are direct, below 22 words per
sentence, and use no banned marketing terms.

## Public promise inventory

All public product promises map to one entry and one exact browser test in
`.factory/claims.json`: demo isolation, repair, MIDI import, live MIDI, timing
score, tempo ramp, tempo ranges, MIDI export, JSON round-trip, saved history,
offline use, local processing, and no checkout.

## Terminology

| Concept | Product term |
| --- | --- |
| One recorded or imported MIDI performance | take |
| The local collection | saved takes |
| Pedal-aware note-length edit | repair |
| Repeated-pitch collision | overlap |
| Shipped practice material | sample data |
| Isolated sample mode | demo |
