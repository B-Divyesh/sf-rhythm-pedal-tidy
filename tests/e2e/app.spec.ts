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

function typeZeroMidi(): Buffer {
  return Buffer.from([
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 1, 0xe0,
    0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 13,
    0, 0x90, 60, 100,
    0x83, 0x60, 0x80, 60, 0,
    0, 0xff, 0x2f, 0
  ]);
}

function typeOneMidi(): Buffer {
  return Buffer.from([
    0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 2, 1, 0xe0,
    0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 11,
    0, 0xff, 0x51, 3, 7, 0xa1, 0x20,
    0, 0xff, 0x2f, 0,
    0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, 13,
    0, 0x90, 64, 96,
    0x83, 0x60, 0x80, 64, 0,
    0, 0xff, 0x2f, 0
  ]);
}

function sessionFixture(name: string, notes = [{ id: 'note-1', pitch: 60, channel: 0, velocity: 90, startMs: 0, endMs: 80 }], pedals: Array<{ timeMs: number; down: boolean; channel: number }> = []) {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    createdAt: '2026-08-30T00:00:00.000Z',
    source: 'json',
    bpm: 120,
    notes,
    pedals
  };
}

async function downloadBuffer(download: import('@playwright/test').Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
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
  await expect(page).toHaveURL(/\?demo=1$/);
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

test('one click opens the in-use sample and its first decision inside the 390 by 844 viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.hero').getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\?demo=1$/);
  await expect(page.locator('.hero')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Warm-up in C' })).toBeInViewport();
  await expect(page.getByText('3 clean cuts suggested')).toBeInViewport();
  await expect(page.locator('.diff-stack')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Accept cleanup' })).toBeInViewport();
});

test('@claim:pedal-overlap-repair repairs sample and held-at-end pedal overlaps without moving note starts', async ({ page }) => {
  await goDemo(page);
  await expect(page.getByText('3 clean cuts suggested')).toBeVisible();
  await expect(page.getByText('2.74s', { exact: true })).toBeVisible();
  await expect(page.locator('.roll-row')).toHaveCount(2);
  await expect(page.getByText(/Repeated pitches are then cut at the next strike/i)).toBeVisible();

  const heldAtEnd = sessionFixture('Held pedal ending', [
    { id: 'first-c4', pitch: 60, channel: 0, velocity: 90, startMs: 0, endMs: 200 },
    { id: 'second-c4', pitch: 60, channel: 0, velocity: 91, startMs: 500, endMs: 700 }
  ], [{ timeMs: 50, down: true, channel: 0 }]);
  await page.locator('#file-input').setInputFiles({ name: 'held-pedal.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(heldAtEnd)) });
  await expect(page.getByText('1 clean cut suggested')).toBeVisible();
  await expect(page.getByText('0.20s', { exact: true })).toBeVisible();
  const sessionDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export take' }).click();
  const exported = JSON.parse((await downloadBuffer(await sessionDownload)).toString()) as typeof heldAtEnd & { cleanedNotes: Array<{ startMs: number; endMs: number; sustainedEndMs: number; velocity: number }> };
  expect(exported.cleanedNotes.map(({ startMs, endMs, sustainedEndMs, velocity }) => ({ startMs, endMs, sustainedEndMs, velocity }))).toEqual([
    { startMs: 0, endMs: 500, sustainedEndMs: 700, velocity: 90 },
    { startMs: 500, endMs: 700, sustainedEndMs: 700, velocity: 91 }
  ]);
});

test('@claim:standard-midi-import imports Standard MIDI type 0 and type 1 files', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({ name: 'type-zero.mid', mimeType: 'audio/midi', buffer: typeZeroMidi() });
  await expect(page.getByRole('heading', { name: 'type-zero' })).toBeVisible();
  await expect(page.locator('.stats-strip')).toContainText('1notes');
  await page.locator('#file-input').setInputFiles({ name: 'type-one.mid', mimeType: 'audio/midi', buffer: typeOneMidi() });
  await expect(page.getByRole('heading', { name: 'type-one' })).toBeVisible();
  await expect(page.locator('.stats-strip')).toContainText('1notes');
});

test('@claim:live-midi-input records notes and CC64 from a compatible Web MIDI input', async ({ page }) => {
  await page.addInitScript(() => {
    const input = { id: 'test-midi-input', name: 'Test MIDI Keyboard', onmidimessage: null as ((event: { data: Uint8Array }) => void) | null };
    Object.defineProperty(window, '__testMidiInput', { value: input });
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: async () => ({ inputs: new Map([[input.id, input]]) })
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect live MIDI' }).click();
  await expect(page.locator('#announcer')).toHaveText('1 MIDI input found.');
  await page.getByRole('combobox', { name: 'Input' }).selectOption('test-midi-input');
  await page.getByRole('button', { name: 'Record take' }).click();
  await page.evaluate(() => {
    const input = (window as unknown as { __testMidiInput: { onmidimessage: (event: { data: Uint8Array }) => void } }).__testMidiInput;
    input.onmidimessage({ data: new Uint8Array([0x90, 60, 100]) });
    input.onmidimessage({ data: new Uint8Array([0xb0, 64, 127]) });
  });
  await page.waitForTimeout(30);
  await page.evaluate(() => {
    const input = (window as unknown as { __testMidiInput: { onmidimessage: (event: { data: Uint8Array }) => void } }).__testMidiInput;
    input.onmidimessage({ data: new Uint8Array([0x80, 60, 0]) });
  });
  await page.getByRole('button', { name: 'Stop take' }).click();
  await expect(page.locator('#announcer')).toHaveText('Live take captured and cleaned.');
  await expect(page.locator('.stats-strip')).toContainText('1notes');
  await expect(page.locator('.stats-strip')).toContainText('1pedal presses');
});

test('@claim:timing-score scores note starts against the sixteenth-note grid', async ({ page }) => {
  await goDemo(page);
  await expect(page.locator('.score-lockup > strong')).toHaveText('92');
  await expect(page.locator('.score-lockup')).toContainText('Mean offset 9 ms');
  await expect(page.locator('.score-breakdown')).toContainText('On grid 8');
});

test('@claim:tempo-ramp increases replay tempo by the chosen step', async ({ page }) => {
  await goDemo(page);
  await page.getByRole('spinbutton', { name: 'Start' }).fill('240');
  await page.getByRole('spinbutton', { name: 'Start' }).blur();
  await page.getByRole('spinbutton', { name: 'Finish' }).fill('245');
  await page.getByRole('spinbutton', { name: 'Finish' }).blur();
  await page.getByRole('button', { name: 'Replay clean take' }).click();
  await expect(page.locator('#announcer')).toHaveText('Replay complete. You reached 245 BPM.', { timeout: 5000 });
  await expect(page.locator('.tempo-readout strong')).toHaveText('245');
});

test('@claim:tempo-control-ranges enforces every published tempo boundary', async ({ page }) => {
  await goDemo(page);
  const enter = async (name: 'Start' | 'Finish' | 'Step', value: string, expected: string, message?: string) => {
    const control = page.getByRole('spinbutton', { name });
    await control.fill(value);
    await control.blur();
    await expect(control).toHaveValue(expected);
    if (message) await expect(page.locator('#announcer')).toHaveText(message);
  };

  await enter('Start', '30', '30');
  await enter('Start', '29', '30', 'Start must be between 30 and 240 BPM. It was set to 30 BPM.');
  await enter('Start', '240', '240');
  await enter('Start', '241', '240', 'Start must be between 30 and 240 BPM. It was set to 240 BPM.');
  await enter('Start', '30', '30');
  await enter('Finish', '30', '30');
  await enter('Finish', '29', '30', 'Finish cannot be below Start. It was set to 30 BPM.');
  await enter('Finish', '300', '300');
  await enter('Finish', '301', '300', 'Finish must be between 30 and 300 BPM. It was set to 300 BPM.');
  await enter('Step', '1', '1');
  await enter('Step', '0', '1', 'Step must be between 1 and 30 BPM. It was set to 1 BPM.');
  await enter('Step', '30', '30');
  await enter('Step', '31', '30', 'Step must be between 1 and 30 BPM. It was set to 30 BPM.');
});

test('@claim:midi-export exports the cleaned sample as a Standard MIDI file without a paid gate', async ({ page }) => {
  await goDemo(page);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cleaned MIDI' }).click();
  const midi = await download;
  expect(midi.suggestedFilename()).toBe('warm-up-in-c-tidy.mid');
  expect((await downloadBuffer(midi)).subarray(0, 4).toString()).toBe('MThd');
});

test('@claim:json-data-roundtrip exports and restores one take and an all-takes backup', async ({ page }) => {
  await goDemo(page);
  const sessionStarted = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export take' }).click();
  const session = await sessionStarted;
  expect(session.suggestedFilename()).toBe('warm-up-in-c.json');
  const sessionBytes = await downloadBuffer(session);
  expect(JSON.parse(sessionBytes.toString()).name).toBe('Warm-up in C');

  const backupStarted = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all data' }).click();
  const backup = await backupStarted;
  expect(backup.suggestedFilename()).toBe('rhythm-pedal-tidy-backup.json');
  const backupBytes = await downloadBuffer(backup);
  expect(JSON.parse(backupBytes.toString()).takes).toHaveLength(1);

  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(`${APP_ORIGIN}/`);
  await expect(page.getByRole('heading', { name: 'Bring in a pedal take' })).toBeVisible();
  await page.locator('#file-input').setInputFiles({ name: 'session.json', mimeType: 'application/json', buffer: sessionBytes });
  await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#file-input').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: backupBytes });
  await expect(page.locator('#announcer')).toHaveText('Restored 1 take.');
});

test('@claim:saved-take-history keeps cleanup acceptance through refresh and supports deletion', async ({ page }) => {
  await page.goto('/');
  await page.locator('#file-input').setInputFiles({ name: 'saved.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(sessionFixture('Saved rehearsal'))) });
  await page.getByRole('button', { name: 'Accept cleanup' }).click();
  await expect(page.getByRole('button', { name: 'Accepted ✓' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Saved rehearsal' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accepted ✓' })).toBeVisible();
  expect(await storedTakeNames(page, REAL_DB)).toEqual(['Saved rehearsal']);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Remove take' }).click();
  await expect(page.getByRole('heading', { name: 'Bring in a pedal take' })).toBeVisible();
  expect(await storedTakeNames(page, REAL_DB)).toEqual([]);
});

test('@claim:offline-reload retains the demo after the first service-worker-controlled visit', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(`${APP_ORIGIN}/demo`);
    await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText(/^Offline:/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export cleaned MIDI' }).click();
    expect((await downloadBuffer(await download)).subarray(0, 4).toString()).toBe('MThd');
    await page.getByRole('button', { name: 'Replay clean take' }).click();
    await expect(page.getByRole('button', { name: 'Stop replay' })).toBeVisible();
    await page.getByRole('button', { name: 'Stop replay' }).click();
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('@claim:local-processing keeps demo cleanup requests on the product origin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await goDemo(page);
  await page.getByRole('button', { name: 'Accept cleanup' }).click();
  await expect(page.locator('#announcer')).toHaveText('Cleanup accepted and saved with this take.');
  const scripts = await page.locator('script[src]').evaluateAll((items) => items.map((item) => new URL((item as HTMLScriptElement).src).origin));
  expect(scripts.every((origin) => origin === APP_ORIGIN)).toBe(true);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === APP_ORIGIN)).toBe(true);
});

test('@claim:no-checkout removes the unavailable paid route and leaves device controls ungated', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No checkout in this build')).toBeVisible();
  await expect(page.getByRole('link', { name: /checkout|buy|plus/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Connect live MIDI' })).toBeEnabled();
  await expect(page.getByText(/No account, payment, analytics, or performance-data upload/i)).toBeVisible();
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
  const requests: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await goDemo(page);
  await expect(page.getByRole('heading', { name: 'Timing score' })).toBeVisible();
  expect(errors).toEqual([]);
  expect(requests.some((url) => new URL(url).pathname === '/online-check')).toBe(false);
});

for (const path of ['/privacy/', '/terms/', '/404.html']) {
  test(`${path} has a main landmark, one heading, and no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page.locator('#route-announcer')).toContainText('loaded.');
    const home = page.locator('header a').first();
    await home.focus();
    await expect(home).toBeFocused();
    expect(await home.evaluate((element) => getComputedStyle(element).outlineColor)).toBe('rgb(255, 250, 240)');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });
}

test('route metadata, common footer identity, and the designed 404 are complete', async ({ page }) => {
  const routes = [
    { path: '/', title: 'Rhythm Pedal Tidy — clean sustain-pedal MIDI', canonical: 'https://rhythm-pedal-tidy.sociobot.in/' },
    { path: '/demo', title: 'Demo — Rhythm Pedal Tidy', canonical: 'https://rhythm-pedal-tidy.sociobot.in/demo' },
    { path: '/privacy/', title: 'Privacy — Rhythm Pedal Tidy', canonical: 'https://rhythm-pedal-tidy.sociobot.in/privacy/' },
    { path: '/terms/', title: 'Terms — Rhythm Pedal Tidy', canonical: 'https://rhythm-pedal-tidy.sociobot.in/terms/' },
    { path: '/404.html', title: 'Page not found — Rhythm Pedal Tidy', canonical: 'https://rhythm-pedal-tidy.sociobot.in/404.html' }
  ];
  for (const route of routes) {
    await page.goto(route.path);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', route.canonical);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/assets\/social-card\.[a-f0-9]{8}\.jpg$/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
    await expect(page.getByText('Built by Param Factory · v1.0.4')).toBeVisible();
  }
  await expect(page.getByRole('heading', { level: 1, name: 'This page is not here.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to the workspace' })).toBeVisible();
  await expect(page.getByText('404 / PAGE NOT FOUND')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Source on GitHub' })).toBeVisible();
});

test('route navigation and browser history focus and announce the route heading', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Demo' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('#route-announcer')).toHaveText('Demo route loaded.');
  await page.goBack();
  await expect(page).toHaveURL(`${APP_ORIGIN}/`);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('#route-announcer')).toHaveText('Rhythm Pedal Tidy workspace loaded.');
});

test('the complete sample action and facts fit at 1280 by 720 and desktop nav targets are 44 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  const bounds = await page.locator('.hero-copy').evaluate((container) => {
    const rect = (selector: string) => {
      const box = container.querySelector(selector)!.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    return { action: rect('.primary'), explainer: rect('.action-explainer'), facts: rect('.hero-facts') };
  });
  expect(bounds.action.top).toBeGreaterThanOrEqual(0);
  expect(bounds.action.bottom).toBeLessThanOrEqual(720);
  expect(bounds.explainer.bottom).toBeLessThanOrEqual(720);
  expect(bounds.facts.bottom).toBeLessThanOrEqual(720);
  for (const link of await page.locator('.site-header nav a').all()) {
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
});

test('Web MIDI permission denial explains how to recover or import instead', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'requestMIDIAccess', {
    configurable: true,
    value: () => Promise.reject(new DOMException('Permission to use Web MIDI API was not granted.', 'SecurityError'))
  }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect live MIDI' }).click();
  await expect(page.locator('#announcer')).toHaveText('MIDI permission was not granted. Allow MIDI in this site’s browser settings, then connect again, or import a .mid file.');
  await expect(page.getByRole('button', { name: '↑ Import MIDI or take file', exact: true })).toBeVisible();
});

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
    // Give filesystems with one-second mtime granularity a distinct update stamp.
    await page.waitForTimeout(1100);
    writeFileSync(workerPath, candidateWorker);
    // A distinct script URL bypasses Chromium's service-worker byte cache while
    // updating the same root-scoped registration.
    await page.evaluate(async () => { await navigator.serviceWorker.register('/sw.js?test-update=1'); });
    await expect(page.locator('#update-toast')).toBeVisible({ timeout: 15000 });
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
  const importButton = page.getByRole('button', { name: '↑ Import MIDI or take file', exact: true });
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
  const back = page.locator('header a').first();
  const backBox = await back.boundingBox();
  expect(backBox?.width).toBeGreaterThanOrEqual(44);
  expect(backBox?.height).toBeGreaterThanOrEqual(44);
});
