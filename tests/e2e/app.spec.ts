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
  for (let index = 0; index < 10; index += 1) {
    await page.keyboard.press('Tab');
    tabStops.push(await page.evaluate(() => document.activeElement?.id ?? ''));
  }
  expect(tabStops).not.toContain('file-input');

  await importButton.focus();
  await expect(importButton).toBeFocused();
  const focusRing = await importButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineColor: style.outlineColor, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
  });
  expect(focusRing.outlineColor).toBe('rgb(255, 250, 240)');
  expect(focusRing.outlineWidth).toBe('3px');
  expect(focusRing.boxShadow).toContain('rgb(23, 24, 19)');
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
