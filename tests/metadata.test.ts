import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const index = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const robots = readFileSync(resolve(process.cwd(), 'public/robots.txt'), 'utf8');
const sitemap = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf8');

describe('search metadata', () => {
  it('ships a canonical landing URL and crawlable static discovery files', () => {
    expect(index).toContain('<link rel="canonical" href="https://rhythm-pedal-tidy.sociobot.in/" />');
    expect(robots).toContain('Sitemap: https://rhythm-pedal-tidy.sociobot.in/sitemap.xml');
    expect(sitemap).toContain('https://rhythm-pedal-tidy.sociobot.in/privacy/');
    expect(sitemap).toContain('https://rhythm-pedal-tidy.sociobot.in/terms/');
  });
});
