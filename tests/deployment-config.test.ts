import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const config = JSON.parse(readFileSync(resolve(process.cwd(), 'public/staticwebapp.config.json'), 'utf8')) as {
  globalHeaders: Record<string, string>;
  routes: Array<{ route: string; headers?: Record<string, string> }>;
};
const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/manifest.webmanifest'), 'utf8')) as { start_url: string };
const serviceWorker = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');

describe('static deployment response policy', () => {
  it('ships immutable caching for Vite-hashed assets', () => {
    expect(config.routes.find((route) => route.route === '/assets/*')?.headers?.['Cache-Control'])
      .toBe('public, max-age=31536000, immutable');
  });

  it('ships the required browser hardening headers without blocking local MIDI', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain('connect-src \'self\' https://api.sociobot.in https://pilot-api.sociobot.in');
    expect(config.globalHeaders['Permissions-Policy']).toBe('accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=(), midi=(self)');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  });

  it('ships a new service-worker cache version and install URL for this release', () => {
    expect(serviceWorker).toContain("const VERSION = 'rpt-v5';");
    expect(serviceWorker).toContain("'/?v=3'");
    expect(manifest.start_url).toBe('/?v=3');
  });
});
