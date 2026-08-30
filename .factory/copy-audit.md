# Landing copy audit

Date: 2026-08-30. The cold landing route and its demo workbench were read from
the production build at 1280×720 and 390×844. Sentence counts split compound
UI blocks at full stops. No sentence exceeds 22 words, and no banned marketing
word appears.

| Visitor-facing sentence | Words | Result |
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
| Import .mid or session | 4 | pass |
| Connect live MIDI | 3 | pass |
| Bring in a pedal take | 5 | pass |
| Import a Standard MIDI type 0 or 1 file. | 9 | pass |
| We’ll find notes held open by CC64 and show each suggested cut. | 12 | pass |
| Import MIDI or session | 4 | pass |
| Use .mid import when live Web MIDI is not available in your browser. | 13 | pass |
| Take shelf | 2 | pass |
| Your first take will appear here and survive refreshes. | 9 | pass |
| Back up every locally saved take in one portable JSON file. | 11 | pass |
| Export all data | 3 | pass |
| Import backup | 2 | pass |
| Bring in your own MIDI. | 5 | pass |
| Import a type 0 or 1 MIDI file, or connect a compatible MIDI input. | 14 | pass |
| Review the repair before export. | 6 | pass |
| No account, payment, analytics, or performance-data upload is used in this build. | 12 | pass |
| All available controls are ready to use. | 8 | pass |
| Read the privacy page to see what stays on your device. | 11 | pass |
| Demo — sample data, nothing is saved to your real takes. | 10 | pass |
| Reset demo | 2 | pass |
| Start for real | 3 | pass |
| 3 clean cuts suggested | 4 | pass |
| 7 note releases extended to pedal-up. | 6 | pass |
| Repeated pitches are then cut at the next strike; timing and velocity stay untouched. | 14 | pass |
| Does this repair look right? | 5 | pass |
| Accepting helps you track whether the pass needed manual work. | 10 | pass |
| Score measures note starts against the nearest sixteenth-note pulse. | 10 | pass |
| It is feedback, not a judgment of feel. | 8 | pass |
| Start is 30–240 BPM, Finish is 100–300 BPM, and Step is 1–30 BPM. | 13 | pass |
| Each completed replay adds 5 BPM, up to 120. | 9 | pass |
| Playback is a simple synth preview. | 6 | pass |
| Pedal sustain is baked into clean note lengths. | 8 | pass |
| Clean sustain-pedal overlaps on this device. | 6 | pass |
| Built by Param Factory · v1.0.1 | 5 | pass |
| Original AI-assisted risograph artwork. | 4 | pass |

## Public promise inventory

Every externally useful promise is represented once in
`.factory/claims.json`: demo isolation, pedal repair and timing preservation,
MIDI type 0/1 import, live Web MIDI, timing score, tempo ramp, MIDI export,
JSON round-trip, saved history, offline use, local processing, and the absence
of checkout or account gates. Each entry points to one exact `@claim:` browser
test, and `npm run test:e2e` builds before running any selected test.

## Terminology

| Concept | Product term |
| --- | --- |
| A recorded or imported MIDI performance | take |
| Pedal-aware note-length edit | repair |
| Repeated-pitch collision | overlap |
| Shipped practice material | sample data |
| Isolated trial mode | demo |
| A musician’s persistent collection | take shelf |
| Saved browser data | local takes |
