import { chromium } from '@playwright/test';

const origin = 'https://rhythm-pedal-tidy.sociobot.in';
const results = {};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const downloadBytes = async (download) => {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};
const browser = await chromium.launch();

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));

  const landingResponse = await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  const responseHeaders = landingResponse.headers();
  const primary = page.locator('.hero').getByRole('link', { name: 'Try it with sample data' });
  assert(await primary.isVisible(), 'sample-data action is not visible');
  await primary.click();
  await page.waitForURL(/\?demo=1$/);
  await page.getByRole('heading', { name: 'Warm-up in C' }).waitFor();
  assert(await page.getByRole('heading', { name: 'Warm-up in C' }).isVisible(), 'sample did not open');
  assert(await page.getByText('3 clean cuts suggested').isVisible(), 'sample repair result absent');
  assert(await page.locator('.roll-row').count() === 2, 'before/after roll absent');
  assert(await page.getByText('Demo — sample data, nothing is saved to your real takes.').isVisible(), 'demo banner absent');

  const databases = await page.evaluate(async () => {
    const names = async (name) => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const values = await new Promise((resolve, reject) => {
        const request = db.transaction('takes').objectStore('takes').getAll();
        request.onsuccess = () => resolve(request.result.map((take) => take.name));
        request.onerror = () => reject(request.error);
      });
      db.close();
      return values;
    };
    return { real: await names('rhythm-pedal-tidy'), demo: await names('demo:rhythm-pedal-tidy') };
  });
  assert(databases.real.length === 0, 'demo touched real storage');
  assert(databases.demo.join() === 'Warm-up in C', 'demo sample missing from demo storage');

  await page.getByRole('button', { name: 'Accept cleanup' }).click();
  await page.waitForFunction(() => document.querySelector('#announcer')?.textContent === 'Cleanup accepted and saved with this take.');
  assert((await page.locator('#announcer').textContent()) === 'Cleanup accepted and saved with this take.', 'acceptance feedback absent');
  const midiStarted = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned MIDI' }).click();
  const midiDownload = await midiStarted;
  const midi = await downloadBytes(midiDownload);
  assert(midiDownload.suggestedFilename() === 'warm-up-in-c-tidy.mid', 'unexpected MIDI filename');
  assert(midi.subarray(0, 4).toString() === 'MThd', 'export is not Standard MIDI');

  const start = page.getByRole('spinbutton', { name: 'Start' });
  await start.fill('29');
  await start.blur();
  assert(await start.inputValue() === '30', 'Start did not clamp to 30');
  const finish = page.getByRole('spinbutton', { name: 'Finish' });
  await finish.fill('301');
  await finish.blur();
  assert(await finish.inputValue() === '300', 'Finish did not clamp to 300');
  const step = page.getByRole('spinbutton', { name: 'Step' });
  await step.fill('0');
  await step.blur();
  assert(await step.inputValue() === '1', 'Step did not clamp to 1');

  await page.locator('#file-input').setInputFiles({ name: 'not-midi.mid', mimeType: 'audio/midi', buffer: Buffer.from('not-midi') });
  await page.waitForFunction(() => document.querySelector('#announcer')?.textContent?.includes('not a standard MIDI file'));
  assert((await page.locator('#announcer').textContent()).includes('not a standard MIDI file'), 'invalid MIDI error absent');
  assert(await page.getByRole('heading', { name: 'Warm-up in C' }).isVisible(), 'invalid import replaced current take');

  const heldAtEnd = {
    id: 'held-pedal-ending', name: 'Held pedal ending', createdAt: '2026-08-30T00:00:00.000Z', source: 'json', bpm: 120,
    notes: [
      { id: 'first-c4', pitch: 60, channel: 0, velocity: 90, startMs: 0, endMs: 200 },
      { id: 'second-c4', pitch: 60, channel: 0, velocity: 91, startMs: 500, endMs: 700 }
    ],
    pedals: [{ timeMs: 50, down: true, channel: 0 }]
  };
  await page.locator('#file-input').setInputFiles({ name: 'held-pedal.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(heldAtEnd)) });
  await page.getByText('1 clean cut suggested').waitFor();
  assert(await page.getByText('1 clean cut suggested').isVisible(), 'held-at-end pedal cut absent');
  const jsonStarted = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export take' }).click();
  const exported = JSON.parse((await downloadBytes(await jsonStarted)).toString());
  const boundaries = exported.cleanedNotes.map(({ startMs, endMs, sustainedEndMs, velocity }) => ({ startMs, endMs, sustainedEndMs, velocity }));
  assert(JSON.stringify(boundaries) === JSON.stringify([
    { startMs: 0, endMs: 500, sustainedEndMs: 700, velocity: 90 },
    { startMs: 500, endMs: 700, sustainedEndMs: 700, velocity: 91 }
  ]), 'held-pedal repair changed starts/velocities or exported wrong boundaries');

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('heading', { name: 'Warm-up in C' }).waitFor();
  assert(await page.getByRole('heading', { name: 'Warm-up in C' }).isVisible(), 'reset did not restore sample');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.waitForURL(`${origin}/`);
  assert(await page.getByRole('heading', { name: 'Bring in a pedal take' }).isVisible(), 'real empty state absent');
  const postDemoDatabases = await page.evaluate(async () => {
    const counts = {};
    for (const name of ['rhythm-pedal-tidy', 'demo:rhythm-pedal-tidy']) {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      counts[name] = await new Promise((resolve, reject) => {
        const request = db.transaction('takes').objectStore('takes').count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
    }
    return counts;
  });
  assert(postDemoDatabases['rhythm-pedal-tidy'] === 0 && postDemoDatabases['demo:rhythm-pedal-tidy'] === 0, 'demo exit did not leave both stores empty');
  assert(requests.every((url) => new URL(url).origin === origin), 'third-party request detected');
  assert(errors.length === 0, `normal-flow browser errors: ${errors.join('; ')}`);
  results.desktopFlow = { databases, postDemoDatabases, midiBytes: midi.length, repairedBoundaries: boundaries, requestCount: requests.length, requestUrls: [...new Set(requests)], responseHeaders, errors };
  await context.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobile = await mobileContext.newPage();
  await mobile.goto(`${origin}/`, { waitUntil: 'networkidle' });
  const firstScreen = await mobile.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, visible: box.top >= 0 && box.bottom <= innerHeight };
    };
    return {
      viewport: [innerWidth, innerHeight], scrollWidth: document.documentElement.scrollWidth,
      h1: rect('h1'), audience: rect('.hero-copy > p'), action: rect('.hero .primary'), explainer: rect('.action-explainer'), facts: rect('.hero-facts')
    };
  });
  assert(firstScreen.scrollWidth === 390, 'mobile horizontal overflow');
  assert(firstScreen.h1.visible && firstScreen.audience.visible && firstScreen.action.visible && firstScreen.explainer.visible && firstScreen.facts.visible, 'mobile first screen does not fit mandatory content');
  const demoLink = mobile.locator('.hero').getByRole('link', { name: 'Try it with sample data' });
  await demoLink.focus();
  const focusStyle = await demoLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineColor: style.outlineColor, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
  });
  await mobile.keyboard.press('Enter');
  await mobile.waitForURL(/\?demo=1$/);
  await mobile.getByRole('heading', { name: 'Warm-up in C' }).waitFor();
  assert(await mobile.getByRole('heading', { name: 'Warm-up in C' }).isVisible(), 'keyboard did not open demo');
  const demoViewport = await mobile.evaluate(() => {
    const inside = (selector) => {
      const box = document.querySelector(selector).getBoundingClientRect();
      return box.top >= 0 && box.bottom <= innerHeight;
    };
    return { h1: inside('h1'), diff: inside('.diff-stack'), acceptance: inside('[data-action="accept"]'), scrollWidth: document.documentElement.scrollWidth };
  });
  assert(demoViewport.h1 && demoViewport.diff && demoViewport.acceptance, 'sample value/decision not visible on mobile');
  const replay = mobile.getByRole('button', { name: 'Replay clean take' });
  await replay.focus();
  await mobile.keyboard.press('Space');
  assert(await mobile.getByRole('button', { name: 'Stop replay' }).isVisible(), 'Space did not start replay');
  await mobile.keyboard.press('Space');
  assert(await mobile.getByRole('button', { name: 'Replay clean take' }).isVisible(), 'Space did not stop replay');
  const targets = await mobile.locator('a,button,input,select').evaluateAll((elements) => elements.flatMap((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (!box.width || !box.height || style.display === 'none' || style.visibility === 'hidden' || element.getAttribute('tabindex') === '-1') return [];
    return box.width < 44 || box.height < 44 ? [{ tag: element.tagName, text: element.textContent?.trim() || element.getAttribute('aria-label'), width: box.width, height: box.height }] : [];
  }));
  await mobile.screenshot({ path: '.factory/verification-8-evidence/live-demo-mobile.png', fullPage: true });
  results.mobileKeyboard = { firstScreen, demoViewport, focusStyle, undersizedTargets: targets };
  await mobileContext.close();

  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage();
  await reduced.goto(`${origin}/`);
  results.reducedMotion = await reduced.locator('.primary').first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { matches: matchMedia('(prefers-reduced-motion: reduce)').matches, transitionDuration: style.transitionDuration, animationDuration: style.animationDuration, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
  });
  assert(results.reducedMotion.matches && Number.parseFloat(results.reducedMotion.transitionDuration) <= 0.01 && Number.parseFloat(results.reducedMotion.animationDuration) <= 0.01, 'reduced motion is not respected');
  await reducedContext.close();

  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const offline = await offlineContext.newPage();
  const offlineErrors = [];
  offline.on('console', (message) => { if (message.type() === 'error') offlineErrors.push(message.text()); });
  await offline.goto(`${origin}/demo`);
  await offline.evaluate(() => navigator.serviceWorker.ready);
  await offline.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const swBefore = await offline.evaluate(async () => ({
    cacheNames: await caches.keys(),
    controller: navigator.serviceWorker.controller?.scriptURL,
    registrations: (await navigator.serviceWorker.getRegistrations()).map((registration) => ({ scope: registration.scope, active: registration.active?.scriptURL }))
  }));
  await offline.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration(); await registration.update(); });
  await offline.waitForTimeout(1000);
  const falseUpdateToast = await offline.locator('#update-toast').isVisible();
  assert(!falseUpdateToast, 'unchanged worker produced a false update prompt');
  await offlineContext.setOffline(true);
  await offline.reload();
  assert(await offline.getByText(/^Offline:/i).isVisible(), 'offline state absent');
  assert(await offline.getByRole('heading', { name: 'Warm-up in C' }).isVisible(), 'offline sample absent');
  const offlineDownloadStarted = offline.waitForEvent('download');
  await offline.getByRole('button', { name: 'Export cleaned MIDI' }).click();
  const offlineMidi = await downloadBytes(await offlineDownloadStarted);
  assert(offlineMidi.subarray(0, 4).toString() === 'MThd', 'offline MIDI export failed');
  await offline.getByRole('button', { name: 'Replay clean take' }).click();
  assert(await offline.getByRole('button', { name: 'Stop replay' }).isVisible(), 'offline replay failed');
  await offline.getByRole('button', { name: 'Stop replay' }).click();
  results.offlinePwa = { swBefore, falseUpdateToast, offlineMidiBytes: offlineMidi.length, offlineErrors };
  await offlineContext.close();

  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
