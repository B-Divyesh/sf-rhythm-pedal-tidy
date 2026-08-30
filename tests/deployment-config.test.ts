import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const config = JSON.parse(readFileSync(resolve(process.cwd(), 'public/staticwebapp.config.json'), 'utf8')) as {
  globalHeaders: Record<string, string>;
  navigationFallback?: unknown;
  responseOverrides: Record<string, { rewrite: string }>;
  routes: Array<{ route: string; rewrite?: string; headers?: Record<string, string> }>;
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
    expect(config.globalHeaders['Content-Security-Policy']).toContain("connect-src 'self'");
    expect(config.globalHeaders['Content-Security-Policy']).not.toContain('api.sociobot.in');
    expect(config.globalHeaders['Permissions-Policy']).toBe('accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=(), midi=(self)');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  });

  it('ships a new service-worker cache version and install URL for this release', () => {
    expect(serviceWorker).toContain("const VERSION = 'rpt-v7';");
    expect(serviceWorker).toContain("'/demo'");
    expect(serviceWorker).toContain("'/?v=7'");
    expect(serviceWorker).toContain("'/404.html'");
    expect(manifest.start_url).toBe('/?v=7');
  });

  it('rewrites only the real demo route and serves unknown routes through the designed 404', () => {
    expect(config.navigationFallback).toBeUndefined();
    expect(config.routes.find((route) => route.route === '/demo')?.rewrite).toBe('/index.html');
    expect(config.routes.find((route) => route.route === '/demo/')?.rewrite).toBe('/index.html');
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html' });
  });
});
