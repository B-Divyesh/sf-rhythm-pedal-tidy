# Rhythm Pedal Tidy

Rhythm Pedal Tidy is a local-first practice utility for keyboard and e-kit
players whose sustain-pedal recordings leave overlapping notes in the piano
roll. It imports or records MIDI, expands CC64 sustain into explicit note
lengths, trims repeated pitches at the next strike, explains every change,
scores timing, and exports a clean Standard MIDI file.

Live product: <https://rhythm-pedal-tidy.sociobot.in>

## What ships

- Standard MIDI type 0/1 import with tempo, running-status, note, and CC64
  parsing
- Pedal-aware de-overlap pass with before/after piano rolls and acceptance
  tracking
- Sixteenth-note timing score and a replay tempo ramp
- Clean MIDI and portable JSON export/import
- IndexedDB take history that works after refresh and offline
- Installable PWA shell, responsive 390 px layout, and keyboard operation
- Optional $12 one-time Plus license for live Web MIDI recording and unlimited
  visible history; the core repair and all data export remain free

Performance data never leaves the browser. The only remote product request is
license verification after a user supplies or buys a Plus license.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Vite prints the local URL. Web MIDI requires a secure context; localhost is
treated as secure by Chromium browsers. Safari users can use `.mid` import.

## Test and build

```bash
npm test
npm run build
npx playwright install chromium  # first browser-test run only
npm run test:e2e
```

The exact production build command is `npm run build`. Static output lands in
`./dist`, with `dist/index.html` at its root. Preview it with:

```bash
npm run preview
```

The browser suite covers accessibility, console errors, keyboard replay,
mobile layout behavior, IndexedDB persistence, legal pages, and an explicit
offline reload.

## How cleanup works

For each channel and pitch, the pass finds whether CC64 was down when note-off
arrived. It first extends that note to the following pedal-up. If the same
pitch is struck again before then, the earlier note is cut exactly at the new
note-on. Starts and velocities are not quantized. Export omits pedal messages
because their musical effect is baked into the repaired note durations.

## Privacy, billing, and deployment

The app has no analytics, ad tech, external fonts, or third-party runtime
scripts. See [`public/privacy/index.html`](public/privacy/index.html) and
[`public/terms/index.html`](public/terms/index.html).

Plus checkout and verification use only the Sociobot billing API. Staging and
localhost use `pilot-api.sociobot.in`; the production hostname uses
`api.sociobot.in`. Product IDs are not embedded.

Deploy the contents of `dist/` to the static host. DNS, billing registration,
and infrastructure are intentionally outside this repository.

## Visual system and license

The cassette-era zine system and original artwork provenance are recorded in
[.factory/design.md](.factory/design.md). Source is MIT licensed; see
[LICENSE](LICENSE).
