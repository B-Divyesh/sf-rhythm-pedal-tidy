import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const index = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const robots = readFileSync(resolve(process.cwd(), 'public/robots.txt'), 'utf8');
const sitemap = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf8');
const staticPages = [
  { path: 'index.html', title: 'Rhythm Pedal Tidy — clean sustain-pedal MIDI', canonical: 'https://rhythm-pedal-tidy.sociobot.in/' },
  { path: 'public/privacy/index.html', title: 'Privacy — Rhythm Pedal Tidy', canonical: 'https://rhythm-pedal-tidy.sociobot.in/privacy/' },
  { path: 'public/terms/index.html', title: 'Terms — Rhythm Pedal Tidy', canonical: 'https://rhythm-pedal-tidy.sociobot.in/terms/' },
  { path: 'public/404.html', title: 'Page not found — Rhythm Pedal Tidy', canonical: 'https://rhythm-pedal-tidy.sociobot.in/404.html' }
];

describe('search metadata', () => {
  it('ships a canonical landing URL and crawlable static discovery files', () => {
    expect(index).toContain('<link rel="canonical" href="https://rhythm-pedal-tidy.sociobot.in/" />');
    expect(robots).toContain('Sitemap: https://rhythm-pedal-tidy.sociobot.in/sitemap.xml');
    expect(sitemap).toContain('https://rhythm-pedal-tidy.sociobot.in/demo');
    expect(sitemap).toContain('https://rhythm-pedal-tidy.sociobot.in/privacy/');
    expect(sitemap).toContain('https://rhythm-pedal-tidy.sociobot.in/terms/');
  });

  it('ships complete route and sharing metadata with the product artwork', () => {
    for (const page of staticPages) {
      const html = readFileSync(resolve(process.cwd(), page.path), 'utf8');
      expect(html).toContain(`<title>${page.title}</title>`);
      expect(html).toContain(`<link rel="canonical" href="${page.canonical}`);
      expect(html).toContain('name="description"');
      expect(html).toContain('property="og:title"');
      expect(html).toContain('property="og:description"');
      expect(html).toContain('property="og:image" content="https://rhythm-pedal-tidy.sociobot.in/assets/social-card.jpg"');
      expect(html).toContain('name="twitter:card" content="summary_large_image"');
      expect(html).toContain('name="twitter:image"');
      expect(html).toContain('rel="apple-touch-icon" sizes="180x180"');
    }
  });

  it('keeps titles and descriptions within metadata limits', () => {
    for (const page of staticPages) {
      const html = readFileSync(resolve(process.cwd(), page.path), 'utf8');
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? '';
      const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? '';
      expect(title.length).toBeLessThanOrEqual(60);
      expect(description.length).toBeLessThanOrEqual(155);
    }
  });
});
