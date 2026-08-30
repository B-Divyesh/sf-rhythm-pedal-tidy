# Rhythm Pedal Tidy — repair handoff

Date: 2026-08-30  
Work order: `rhythm-pedal-tidy-repair-5`  
Base verifier candidate: `26ea5d2f90758fe1b2a563227bacaa2b37df8d70`  
Repair implementation: `04b7b3a` (`fix: isolate demo and remove unavailable checkout`)  
Deployment class: static PWA (`dist/`)

## Result: ready to deploy

Every release blocker from `.factory/verification-5.md` is repaired in the
source tree and regression-covered.

1. **Claims contract:** Added `.factory/claims.json` with six observable
   public claims, one exact `@claim:` Playwright test per claim, and a unit
   guard for unique/runnable tags.
2. **Isolated demo:** `/demo` and the first-screen **Try it with sample data**
   action seed `Warm-up in C` into `demo:rhythm-pedal-tidy`, never the real
   `rhythm-pedal-tidy` database. The persistent banner has **Reset demo** and
   **Start for real**; the latter clears demo data before returning home.
   `.factory/demo.md` documents the route, sample, reset, and namespace.
3. **First read:** The landing heading now states “Clean sustain-pedal MIDI
   overlaps,” names keyboard/e-kit players, puts the sample action first, and
   gives three short facts. `.factory/copy-audit.md` records sentence counts
   and terminology.
4. **Broken checkout:** The Sociobot checkout was confirmed live-404 and this
   repo may not register billing products. The shipped build therefore removes
   the nonfunctional $12 link, license flow, remote billing CSP allowlist, and
   paid gates. Import, cleanup, export, take history, and compatible live Web
   MIDI are now available without purchase. This is the closest honest release
   while billing registration remains factory-owned.
5. **Billing allowance/429:** `.factory/billing.md` documents that this build
   makes zero billing requests, so no unverified rate-limit contract remains.
   The `@claim:no-checkout` browser test asserts no billing URL is shipped and
   the device control is ungated.

## Verification

Clean local run on this repair:

```text
npm ci                         96 packages; 0 vulnerabilities
npm test                       15/15 passed
npm run build                  passed; dist/ produced
npm run test:e2e               23/23 passed
```

The six documented claim commands each passed independently:

```text
@claim:demo-isolation
@claim:pedal-overlap-repair
@claim:midi-export
@claim:offline-reload
@claim:local-processing
@claim:no-checkout
```

Browser coverage includes desktop 1440 px and mobile 390 px workbenches,
first-screen action, separate IndexedDB namespaces, reset/start-real cleanup,
keyboard replay and focus retention, 44 px targets, 200% text zoom,
reduced-motion behavior, malformed backup recovery, high-tempo MIDI recovery,
MIDI download bytes, request-origin privacy, offline reload in a dedicated
browser context, and a controlled old-worker → current-worker update toast.
Playwright Axe scans for landing/demo/privacy/terms found no serious or
critical violations. `verify-url.sh` passed on `/` and `/demo`: each returned
200 with no console errors, `lang=en`, one h1, a main landmark, and no missing
image alt or unlabelled button.

Mobile Lighthouse against the production build preview: Performance **100**,
Accessibility **100**, Best Practices **100**, SEO **100**; FCP **0.9 s**,
LCP **1.7 s**, TBT **0 ms**, CLS **0**. Bundle output: JS **32,678 B raw /
12.12 kB gzip**, CSS **16,538 B raw / 4.33 kB gzip**, mobile hero WebP
**52,926 B**.

Response-policy regressions verify immutable hashed-asset caching, CSP with
same-origin `connect-src`, HSTS-compatible security headers, and the updated
PWA cache version (`rpt-v6`, start URL `/?v=4`). The standalone Axe CLI could
not start Selenium Chrome in this container; the installed Playwright
`@axe-core` scanner was used directly against the same Chromium browser and
passed.

## Deploy and live identity

Static deployment is pending the factory deploy command. Build hashes before
deployment:

```text
index.html                  e39fcbed939c195aadbeb92d2d63e7bd998aa795e5cbd39ac994e9edd753a939
sw.js                       73a83f1d0e286a91ed1f4336d1936cce2fc1deb888f49c1d2d91a97ee125ce2b
manifest.webmanifest        9305e0db89bcc628437ad5999861c0f65df16a93f863da36cc9e72c5f353a688
assets/index-Bgpoe8ei.js    278da9423017e11816fc608aa0ab1c69992a167c12221f208c65349fb4b9209f
assets/index-DcB6-hwY.css   2bc571efb9ef91c9a085519993647187bedf742d148948199f77677d3bfff4be
```

After deployment, compare these static files on
`https://rhythm-pedal-tidy.sociobot.in` and confirm `/demo`, offline reload,
and the response headers.

## Known gaps and next step

- A physical Web MIDI device/permission prompt is not available in the
  container. The import fallback and ungated connect control are tested; test
  physical capture on a compatible keyboard/e-kit before claiming device
  compatibility beyond the browser API.
- The factory must register a future Sociobot product before reintroducing a
  paid tier. Do not restore a checkout link until it returns a hosted checkout
  successfully and its verification policy can be tested.
