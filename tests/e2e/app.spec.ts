import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const APP_ORIGIN = 'http://127.0.0.1:4173';
const REAL_DB = 'rhythm-pedal-tidy';
const DEMO_DB = 'demo:rhythm-pedal-tidy';

function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const channels = hex.match(/[a-f\d]{2}/gi)!.map((value) => Number.parseInt(value, 16) / 255);
    const [red = 0, green = 0, blue = 0] = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const [one, two] = [luminance(first), luminance(second)];
  return (Math.max(one, two) + 0.05) / (Math.min(one, two) + 0.05);
}

const verifierMalformedBackup = {
  version: 1,
  takes: [{
    id: 'broken',
    name: 'Broken backup',
    createdAt: '2026-08-28T00:00:00Z',
    source: 'json',
    bpm: 120,
    notes: [{ id: 'n', pitch: 60, channel: 0, velocity: 100, startMs: 0, endMs: 100 }]
  }]
};

function highTempoMidi(): Buffer {
  return Buffer.from([
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 1, 0xe0,
    0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 20,
    0, 0xff, 0x51, 3, 2, 0x49, 0xf0,
    0, 0x90, 60, 100,
    0x83, 0x60, 0x80, 60, 0,
    0, 0xff, 0x2f, 0
  ]);
}

async function storedTakeNames(page: import('@playwright/test').Page, databaseName = DEMO_DB): Promise<string[]> {
  return page.evaluate(async (dbName) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const names = await new Promise<string[]>((resolve, reject) => {
      const request = database.transaction('takes').objectStore('takes').getAll();
      request.onsuccess = () => resolve((request.result as Array<{ name: string }>).map((take) => take.name));
      request.onerror = () => reject(request.error);
    });
    database.close();
    return names;
  }, databaseName);
}

async function goDemo(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Rhythm Pedal Tidy');
  await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
}

test('@claim:demo-isolation Try it with sample data is isolated from real take storage', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(/Clean sustain-pedal MIDI overlaps/i);
  await page.locator('.hero').getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved to your real takes.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
  expect(await storedTakeNames(page, REAL_DB)).toEqual([]);
  expect(await storedTakeNames(page, DEMO_DB)).toEqual(['Warm-up in C']);

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#announcer')).toHaveText('Demo reset. The sample take is ready again.');
  expect(await storedTakeNames(page, REAL_DB)).toEqual([]);
  expect(await storedTakeNames(page, DEMO_DB)).toEqual(['Warm-up in C']);

  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(`${APP_ORIGIN}/`);
  await expect(page.getByRole('heading', { name: 'Bring in a pedal take' })).toBeVisible();
  expect(await storedTakeNames(page, REAL_DB)).toEqual([]);
  expect(await storedTakeNames(page, DEMO_DB)).toEqual([]);
});

test('@claim:pedal-overlap-repair shows a pedal-aware before and after repair', async ({ page }) => {
  await goDemo(page);
  await expect(page.getByText('3 clean cuts suggested')).toBeVisible();
  await expect(page.getByText('2.74s', { exact: true })).toBeVisible();
  await expect(page.locator('.roll-row')).toHaveCount(2);
  await expect(page.getByText(/Repeated pitches are then cut at the next strike/i)).toBeVisible();
});

test('@claim:midi-export exports the cleaned sample as a Standard MIDI file without a paid gate', async ({ page }) => {
  await goDemo(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned MIDI' }).click();
  const midi = await download;
  expect(midi.suggestedFilename()).toBe('warm-up-in-c-tidy.mid');
  const stream = await midi.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).subarray(0, 4).toString()).toBe('MThd');
});

test('@claim:offline-reload retains the demo after the first service-worker-controlled visit', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto(`${APP_ORIGIN}/demo`);
    await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText(/Offline deck/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export cleaned MIDI' })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:local-processing keeps demo cleanup requests on the product origin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await goDemo(page);
  await page.getByRole('button', { name: 'Accept cleanup' }).click();
  await expect(page.locator('#announcer')).toHaveText('Cleanup accepted. Nice take.');
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === APP_ORIGIN)).toBe(true);
});

test('@claim:no-checkout removes the unavailable paid route and leaves device controls ungated', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No checkout in this build')).toBeVisible();
  await expect(page.getByRole('link', { name: /checkout|buy|plus/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Connect live MIDI' })).toBeEnabled();
  const billingLinks = await page.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? '').filter((href) => href.includes('sociobot.in/api/v1/products')));
  expect(billingLinks).toEqual([]);
});

test('has no serious or critical accessibility violations on the landing page and demo', async ({ page }) => {
  await page.goto('/');
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await goDemo(page);
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('loads the landing page and demo without normal-path browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await goDemo(page);
  await expect(page.getByRole('heading', { name: 'Timing score' })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const path of ['/privacy/', '/terms/']) {
  test(`${path} has a main landmark, one heading, and no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await page.locator('header a').focus();
    await expect(page.locator('header a')).toBeFocused();
    expect(await page.locator('header a').evaluate((element) => getComputedStyle(element).outlineColor)).toBe('rgb(255, 250, 240)');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });
}

test('a first service-worker install does not offer a false update', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await expect(page.locator('#update-toast')).toBeHidden();
});

test('a waiting service-worker update offers the in-app refresh control', async ({ page }) => {
  const workerPath = resolve(process.cwd(), 'dist/sw.js');
  const candidateWorker = readFileSync(workerPath, 'utf8');
  const oldWorker = `self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));`;
  try {
    writeFileSync(workerPath, oldWorker);
    await page.goto('/');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    // Reload under the old controller so the app records that an update is real.
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    writeFileSync(workerPath, candidateWorker);
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    await expect(page.locator('#update-toast')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update now' })).toBeVisible();
  } finally {
    writeFileSync(workerPath, candidateWorker);
  }
});

test('mobile demo content stays reachable inside its final section', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await goDemo(page);
  const overflow = await page.locator('.unlock-section').evaluate((section) => {
    const bounds = section.getBoundingClientRect();
    const descendants = Array.from(section.querySelectorAll<HTMLElement>('*'));
    return {
      sectionClientWidth: section.clientWidth,
      sectionScrollWidth: section.scrollWidth,
      mainOverflow: getComputedStyle(document.querySelector('main')!).overflowX,
      clipped: descendants.flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height || (rect.left >= bounds.left - 0.5 && rect.right <= bounds.right + 0.5)) return [];
        return [{ tag: element.tagName, className: element.className, left: rect.left, right: rect.right }];
      })
    };
  });
  expect(overflow.sectionScrollWidth).toBeLessThanOrEqual(overflow.sectionClientWidth);
  expect(overflow.mainOverflow).not.toBe('hidden');
  expect(overflow.clipped).toEqual([]);
});

test('keyboard shortcut starts and stops replay', async ({ page }) => {
  await goDemo(page);
  await page.getByRole('button', { name: 'Replay clean take' }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Stop replay' })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Replay clean take' })).toBeVisible();
});

test('mobile keyboard import path has no hidden file-picker stop and shows a high-contrast focus ring', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const fileInput = page.locator('#file-input');
  const importButton = page.getByRole('button', { name: /Import \.mid or session/i });
  await expect(fileInput).toHaveAttribute('tabindex', '-1');
  const tabStops: string[] = [];
  let importButtonReached = false;
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => ({ id: document.activeElement?.id ?? '', action: document.activeElement?.getAttribute('data-action') ?? '' }));
    tabStops.push(active.id || active.action);
    importButtonReached ||= active.action === 'import';
    if (importButtonReached) break;
  }
  expect(tabStops).not.toContain('file-input');
  expect(importButtonReached).toBe(true);
  await expect(importButton).toBeFocused();
  await page.waitForTimeout(220);
  const focusRing = await importButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineColor: style.outlineColor, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
  });
  expect(focusRing.outlineColor).toBe('rgb(255, 250, 240)');
  expect(focusRing.outlineWidth).toBe('3px');
  expect(focusRing.boxShadow).toContain('rgb(23, 24, 19) 0px 0px 0px 6px');
  expect(contrastRatio('#fffaf0', '#c9342f')).toBeGreaterThanOrEqual(3);
  expect(contrastRatio('#171813', '#f3eddd')).toBeGreaterThanOrEqual(3);
  expect(contrastRatio('#171813', '#fffaf0')).toBeGreaterThanOrEqual(3);
  expect(contrastRatio('#fffaf0', '#171813')).toBeGreaterThanOrEqual(3);
});

test('desktop workbench remains within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await goDemo(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('reduced-motion settings remove decorative movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const motion = await page.locator('.primary').first().evaluate((element) => {
    const style = getComputedStyle(element);
    return { transitionDuration: style.transitionDuration, animationDuration: style.animationDuration, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior };
  });
  expect(Number.parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(0.01);
  expect(Number.parseFloat(motion.animationDuration)).toBeLessThanOrEqual(0.01);
  expect(motion.scrollBehavior).toBe('auto');
});

test('200 percent text zoom keeps the first action and demo controls operable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await expect(page.getByRole('link', { name: 'Try it with sample data' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Try it with sample data' }).first().click();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start for real' })).toBeVisible();
});

test('tempo ramp recovers invalid values without putting them into playback state', async ({ page }) => {
  await goDemo(page);
  const start = page.getByRole('spinbutton', { name: 'Start' });
  await start.fill('29');
  await start.blur();
  await expect(start).toHaveValue('30');
  await expect(page.getByText('BPM now', { exact: true }).locator('..').getByText('30', { exact: true })).toBeVisible();
  await expect(page.locator('#announcer')).toHaveText('Start must be between 30 and 240 BPM. It was set to 30 BPM.');
  const step = page.getByRole('spinbutton', { name: 'Step' });
  await step.fill('');
  await step.blur();
  await expect(step).toHaveValue('5');
  await expect(page.locator('#announcer')).toHaveText('Step needs a whole BPM value. It was restored to 5 BPM.');
});

test('a malformed backup preserves the demo take and stays recoverable after reload', async ({ page }) => {
  const errors: string[] = [];
  let confirmationShown = false;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', async (dialog) => { confirmationShown = true; await dialog.dismiss(); });
  await goDemo(page);
  expect(await storedTakeNames(page)).toEqual(['Warm-up in C']);
  await page.locator('#file-input').setInputFiles({
    name: 'broken-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(verifierMalformedBackup))
  });
  await expect(page.locator('#announcer')).toHaveText('That backup is invalid (take.pedals is missing). Nothing was changed.');
  await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
  expect(await storedTakeNames(page)).toEqual(['Warm-up in C']);
  expect(confirmationShown).toBe(false);
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
  expect(await storedTakeNames(page)).toEqual(['Warm-up in C']);
  expect(errors).toEqual([]);
});

test('a 400 BPM MIDI starts with a valid bounded tempo ramp', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({ name: '400-bpm.mid', mimeType: 'audio/midi', buffer: highTempoMidi() });
  const start = page.getByRole('spinbutton', { name: 'Start' });
  const finish = page.getByRole('spinbutton', { name: 'Finish' });
  await expect(start).toHaveValue('240');
  await expect(finish).toHaveValue('300');
  await expect(page.locator('.tempo-readout strong')).toHaveText('240');
  await expect(page.locator('#tempo-guidance')).toContainText('Start is 30–240 BPM, Finish is 240–300 BPM');
  expect(await start.evaluate((input) => (input as HTMLInputElement).checkValidity())).toBe(true);
  expect(await finish.evaluate((input) => (input as HTMLInputElement).checkValidity())).toBe(true);
});

test('keyboard actions retain a logical focus target after rerendering', async ({ page }) => {
  await goDemo(page);
  const start = page.getByRole('spinbutton', { name: 'Start' });
  await start.focus();
  await start.fill('90');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('spinbutton', { name: 'Finish' })).toBeFocused();
  const replay = page.getByRole('button', { name: 'Replay clean take' });
  await replay.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Stop replay' })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Replay clean take' })).toBeFocused();
});

test('all mobile footer and legal navigation links have 44 pixel hit areas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const link of await page.locator('footer nav a').all()) {
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  const home = page.locator('.site-header .brand');
  await expect(home).toBeVisible();
  const homeBox = await home.boundingBox();
  expect(homeBox?.width).toBeGreaterThanOrEqual(44);
  expect(homeBox?.height).toBeGreaterThanOrEqual(44);
  await page.goto('/privacy/');
  const back = page.locator('header a');
  const backBox = await back.boundingBox();
  expect(backBox?.width).toBeGreaterThanOrEqual(44);
  expect(backBox?.height).toBeGreaterThanOrEqual(44);
});
