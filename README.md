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

- Imports Standard MIDI type 0/1 files and records compatible live Web MIDI
  input after browser permission
- Expands CC64 sustain through pedal-up or the captured take boundary, then
  trims a repeated pitch at the next strike without moving note starts
- Scores note starts against a sixteenth-note grid and offers a replay tempo
  ramp
- Exports cleaned MIDI and restores session or all-takes JSON files
- Stores take history and cleanup acceptance in local IndexedDB
- Reloads the cached demo offline, where replay and MIDI export remain usable

MIDI performance data is processed on the device. This build has no analytics,
tracking, payment, checkout, account, or remote license verification.

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
npm run test:e2e # runs its own production build before browser tests
```

Run the claim checks listed in [.factory/claims.json](.factory/claims.json),
for example:

```bash
npm run test:e2e -- --grep @claim:demo-isolation
```

Every exact claim command runs its required production build after `npm ci`.
The production build is `npm run build`. It writes a static PWA to `dist/`,
with `dist/index.html` at its root. Preview it with `npm run preview`.

## Privacy, terms, and deployment

Read the in-product [privacy policy](public/privacy/index.html) and
[terms](public/terms/index.html). The app has no third-party fonts or runtime
scripts. The only normal browser requests are to this static product origin.

Deploy `dist/` as a static site using the supplied Static Web Apps response
policy. It rewrites `/demo` to the app and sends unknown URLs to the styled
404 response. DNS, billing registration, and infrastructure are managed by
the factory and are intentionally outside this repository. No checkout ships
in this build, so all available controls are free.

## Visual system and license

The cassette-era zine system and original artwork provenance are in
[.factory/design.md](.factory/design.md). Source is MIT licensed; see
[LICENSE](LICENSE).
