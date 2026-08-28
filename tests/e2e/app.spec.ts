import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
