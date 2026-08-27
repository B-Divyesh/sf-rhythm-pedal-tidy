# Independent verification — FAIL

Date: 2026-08-27  
Work order: `rhythm-pedal-tidy-verify-1`  
Candidate commit: `4c006ebd3d84d612cb7c4f31ea4c3efa51a58b5d`  
Production URL: <https://rhythm-pedal-tidy.sociobot.in>

## Verdict

**FAIL.** The build, core import/cleanup/export path, PWA behavior, and
accessibility smoke tests pass, and the live static artifact exactly matches
the candidate. It still fails the acceptance contract because the tempo-ramp
inputs accept invalid values into product state and the deployed hashed assets
do not have the required long-lived immutable caching policy.

## Reproducible findings

| Severity | Finding | Fresh evidence / impact |
| --- | --- | --- |
| P2 | Tempo ramp does not enforce its advertised range or recover from invalid input. | In Chromium, load **Try the example**, set Start to `29`, then blur. The input remains `29`, `checkValidity()` is `false`, and the product's **BPM now** readout becomes `29`, despite `min=30`. The change handler assigns `Number(value)` without validation. The same path permits blank/otherwise-invalid number state. This violates the required invalid-input/recovery behavior for the core tempo-ramp feature. |
| P2 | Hashed production JS/CSS are not cached immutably. | `HEAD /assets/index-1r2G-0ye.js` and `HEAD /assets/index-CZIQRJs5.css` on the production URL both return `cache-control: public, must-revalidate, max-age=30`. The PWA/performance contract requires long-lived immutable caching for hashed assets. This causes unnecessary revalidation and does not meet the stated deployment caching requirement. |
| P3 | Browser response-policy hardening is incomplete. | Production responses include HSTS, `nosniff`, and `strict-origin-when-cross-origin`, but no `Content-Security-Policy`, `Permissions-Policy`, or frame-embedding policy. This was observed on `/`; it is a deployment policy gap, not a product-code change made by this verification. |

## What passed

- Clean checkout at the candidate commit; `npm ci` completed with 0 reported vulnerabilities.
- `npm test`: **5/5** Vitest tests passed.
- Exact build command, `npm run build`: passed; `dist/` produced. Output is JS **28.73 kB raw / 10.91 kB gzip** and CSS **15.57 kB raw / 4.15 kB gzip**, both inside the static budgets. The mobile hero WebP is **52,926 bytes**. No third-party font or runtime CDN is used.
- After installing the repository's pinned Playwright Chromium in this fresh container, `npm run test:e2e`: **6/6** passed. The initial browser-suite failure was solely the clean environment's absent Chromium executable; rerunning after `npx playwright install chromium` passed unchanged.
- Manual Chromium desktop (1440 x 1000) and mobile (390 x 844) review: the task hierarchy remains usable, controls stack on mobile, and all sampled keyboard focus rings were visible (`4px` mustard outline). Reduced-motion emulation reports `.01ms` transitions/animations.
- Core representative job: sample take loaded; it showed **3 clean cuts suggested**; acceptance survived reload via IndexedDB; exported `warm-up-in-c-tidy.mid` starts with `MThd` and is format 0. Invalid `bad.mid` input announced “That file is not a standard MIDI file (.mid).”; loading the sample immediately afterward recovered normally. The accessible error is delivered through the status region.
- `axe-core` had **0 serious/critical** findings on empty and populated workspaces and on `/privacy/` and `/terms/`. Normal online load had no page errors or console errors in the repository suite.
- PWA: offline reload after install retained the populated workspace, offline banner, and MIDI export control. A controlled local service-worker version update (temporary copy only; candidate source untouched) produced the in-app **A fresh version is ready** update toast.
- Privacy/network: browser observation of the normal flow made no third-party requests. Code inspection confirms takes use IndexedDB and normal performance data is not transmitted; the only designed external request is the Sociobot license verification after a user provides a license. No analytics were found.
- Deployment identity: SHA-256 content comparisons matched local `dist` and the live URL for `/`, JS, CSS, `/sw.js`, manifest, offline page, privacy page, and terms page. The live deployment is therefore the candidate artifact.

## Notes

- A real Web MIDI device and permission prompt were not available in the headless verification container. The import fallback was exercised end to end; live-device capture remains hardware-only coverage.
- Lighthouse CLI was attempted against the production preview but its current standalone Chromium process crashed in this container. The independent bundle-budget, Axe, console, responsive, and offline checks above completed successfully; no Lighthouse score is claimed here.
- No product code was modified during verification.
