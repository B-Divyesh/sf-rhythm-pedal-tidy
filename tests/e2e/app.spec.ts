import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    0, 0xff, 0x51, 3, 2, 0x49, 0xf0, // 150,000 µs per quarter = 400 BPM
    0, 0x90, 60, 100,
    0x83, 0x60, 0x80, 60, 0,
    0, 0xff, 0x2f, 0
  ]);
}

async function storedTakeNames(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('rhythm-pedal-tidy');
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
  });
}

test('has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Try the example' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('loads without browser console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the example' }).click();
  await expect(page.getByRole('heading', { name: 'Timing score' })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const path of ['/privacy/', '/terms/']) {
  test(`${path} has a main landmark and one heading`, async ({ page }) => {
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

test('sample cleanup works at mobile width and survives offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(/Untangle the pedal take/i);
  await page.getByRole('button', { name: 'Try the example' }).click();
  await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
  await expect(page.getByText(/clean cuts? suggested/i)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText(/Offline deck/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Export cleaned MIDI/i })).toBeVisible();
});

test('a first service-worker install does not offer a false update', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await expect(page.locator('#update-toast')).toBeHidden();
});

test('mobile Plus content stays reachable inside its section', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the example' }).click();

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
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the example' }).click();
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
  await page.waitForTimeout(200);
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
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the example' }).click();
  await expect(page.getByRole('heading', { name: 'Warm-up in C' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('tempo ramp recovers invalid values without putting them into playback state', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the example' }).click();

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

test('a malformed backup preserves the saved take and stays recoverable after reload', async ({ page }) => {
  const errors: string[] = [];
  let confirmationShown = false;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', async (dialog) => { confirmationShown = true; await dialog.dismiss(); });
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the example' }).click();
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
  await page.goto('/');
  const example = page.getByRole('button', { name: 'Try the example' });
  await example.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#take-title')).toBeFocused();

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
