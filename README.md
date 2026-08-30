# Rhythm Pedal Tidy

Rhythm Pedal Tidy cleans sustain-pedal MIDI overlaps for keyboard and e-kit
players. Import or record a practice take, compare the pedal-aware repair,
replay it with a tempo ramp, and export a clean Standard MIDI file.

Live product: <https://rhythm-pedal-tidy.sociobot.in>

## Try the demo

Open <https://rhythm-pedal-tidy.sociobot.in/demo> or select **Try it with
sample data** on the first screen. The demo loads an eight-note practice take
into the `demo:rhythm-pedal-tidy` IndexedDB database. Its banner lets you reset
the sample or start for real; starting for real clears the demo database and
returns to the separate real take shelf. See [.factory/demo.md](.factory/demo.md).

## What it does

- Imports Standard MIDI type 0/1 files and compatible live Web MIDI input
- Expands CC64 sustain, trims repeated-pitch overlap, and shows before/after
  piano rolls before export
- Scores note starts against a sixteenth-note grid and offers a replay tempo
  ramp
- Exports cleaned MIDI, a take JSON file, and an all-takes JSON backup
- Stores real takes locally in IndexedDB and works offline after the first
  visited page is cached

MIDI performance data is processed on the device. This build has no analytics,
payment, checkout, account, or remote license verification.

## Run locally

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Vite prints the local URL. Web MIDI requires a secure context; Chromium treats
localhost as secure. Use `.mid` import when a browser does not provide Web
MIDI.

## Verify, test, and build

```bash
npm ci
npm test
npm run build
npx playwright install chromium # only if the pinned browser is absent
npm run test:e2e
```

Run the claim checks listed in [.factory/claims.json](.factory/claims.json),
for example:

```bash
npm run test:e2e -- --grep @claim:demo-isolation
```

The production build is `npm run build`. It writes a static PWA to `dist/`,
with `dist/index.html` at its root. Preview it with `npm run preview`.

## Privacy, terms, and deployment

Read the in-product [privacy policy](public/privacy/index.html) and
[terms](public/terms/index.html). The app has no third-party fonts or runtime
scripts. The only normal browser requests are to this static product origin.

Deploy `dist/` as a static site using the supplied Static Web Apps response
policy. DNS, billing registration, and infrastructure are managed by the
factory and are intentionally outside this repository. The previously
advertised $12 checkout is not shipped because the corresponding factory
product is not registered; all available controls are therefore free in this
build.

## Visual system and license

The cassette-era zine system and original artwork provenance are in
[.factory/design.md](.factory/design.md). Source is MIT licensed; see
[LICENSE](LICENSE).
