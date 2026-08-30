import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const config = JSON.parse(readFileSync(resolve(process.cwd(), 'public/staticwebapp.config.json'), 'utf8')) as {
  globalHeaders: Record<string, string>;
  mimeTypes?: Record<string, string>;
  navigationFallback?: unknown;
  responseOverrides: Record<string, { rewrite: string }>;
  routes: Array<{ route: string; rewrite?: string; headers?: Record<string, string> }>;
};
const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/manifest.webmanifest'), 'utf8')) as { start_url: string };
const serviceWorker = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');
const appSource = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8');
const shippedImages = readdirSync(resolve(process.cwd(), 'public/assets')).filter((file) => /\.(avif|webp|jpe?g)$/i.test(file));
const immutableCache = 'public, max-age=31536000, immutable';

describe('static deployment response policy', () => {
  it('ships immutable caching only for content-hashed image assets', () => {
    expect(shippedImages).toHaveLength(5);
    for (const image of shippedImages) expect(image).toMatch(/\.[a-f0-9]{8}\.(avif|webp|jpe?g)$/i);
    const immutableRoutes = config.routes.filter((route) => route.headers?.['Cache-Control'] === immutableCache);
    expect(immutableRoutes).toHaveLength(shippedImages.length);
    for (const route of immutableRoutes) {
      expect(route.route).toMatch(/^\/assets\/[\w-]+\.[a-f0-9]{8}\.(avif|webp|jpe?g)$/i);
      expect(route.route).not.toContain('*');
    }
  });

  it('declares the AVIF response type for the static host', () => {
    expect(config.mimeTypes).toEqual(expect.objectContaining({ '.avif': 'image/avif' }));
  });

  it('ships the required browser hardening headers without blocking local MIDI', () => {
    expect(config.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(config.globalHeaders['Content-Security-Policy']).toContain("connect-src 'self'");
    expect(config.globalHeaders['Content-Security-Policy']).not.toContain('api.sociobot.in');
    expect(config.globalHeaders['Permissions-Policy']).toBe('accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=(), midi=(self)');
    expect(config.globalHeaders['X-Frame-Options']).toBe('DENY');
  });

  it('ships a new service-worker cache version and install URL for this release', () => {
    expect(serviceWorker).toContain("const VERSION = 'rpt-v10';");
    expect(serviceWorker).toContain("'/demo'");
    expect(serviceWorker).toContain("'/?demo=1'");
    expect(serviceWorker).toContain("'/?v=10'");
    expect(serviceWorker).toContain("'/404.html'");
    expect(manifest.start_url).toBe('/?v=10');
  });

  it('rewrites only the real demo route and serves unknown routes through the designed 404', () => {
    expect(config.navigationFallback).toBeUndefined();
    expect(config.routes.find((route) => route.route === '/demo')?.rewrite).toBe('/index.html');
    expect(config.responseOverrides['404']).toEqual({ rewrite: '/404.html' });
  });

  it('uses an existing same-origin file for the online probe and skips it while already offline', () => {
    expect(appSource).toContain('fetch(`/robots.txt?online=${Date.now()}`');
    expect(appSource).toContain('if (!navigator.onLine)');
    expect(appSource).not.toContain('/online-check');
  });
});
