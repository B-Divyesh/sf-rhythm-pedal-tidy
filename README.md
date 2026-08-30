# Rhythm Pedal Tidy

Rhythm Pedal Tidy cleans sustain-pedal MIDI overlaps for keyboard and e-kit
players. Import or record a practice take. Compare the repair, replay it with
a tempo ramp, and export clean MIDI.

Live product: <https://rhythm-pedal-tidy.sociobot.in>

## Try the demo

Open <https://rhythm-pedal-tidy.sociobot.in/?demo=1> or select **Try it with
sample data** on the first screen. The demo loads an eight-note practice take
in separate sample storage. Reset demo restores the sample. Start for real
clears the demo and returns to your saved takes. See
[.factory/demo.md](.factory/demo.md).

## What it does

- Imports Standard MIDI type 0/1 files and records compatible live Web MIDI
  input after browser permission
- It extends notes held by the sustain pedal, then cuts a repeated note at the
  next strike. It never moves note starts.
- Scores note starts against a sixteenth-note grid and offers a replay tempo
  ramp
- Exports cleaned MIDI and restores one take or all takes from JSON
- Saves take history and cleanup choices on this device
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
