import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');
const readmeText = readme.replace(/\s+/g, ' ');
const publicFooters = [
  'src/main.ts',
  'public/privacy/index.html',
  'public/terms/index.html',
  'public/404.html',
  'public/offline.html'
].map((path) => readFileSync(resolve(process.cwd(), path), 'utf8')).join('\n');
const appSource = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8');
const privacy = readFileSync(resolve(process.cwd(), 'public/privacy/index.html'), 'utf8');
const claims = readFileSync(resolve(process.cwd(), '.factory/claims.json'), 'utf8');
const catalogDescription = readFileSync(resolve(process.cwd(), '.factory/catalog-description.txt'), 'utf8').trim();

describe('review-1 copy repairs', () => {
  it('removes the decorative artwork claim from every public footer', () => {
    expect(publicFooters).not.toContain('Original AI-assisted risograph artwork.');
  });

  it('uses the approved short README wording for the reviewed workflow and demo sentences', () => {
    const repairedSentences = [
      'Import or record a practice take.',
      'Compare the repair, replay it with a tempo ramp, and export clean MIDI.',
      'The demo loads an eight-note practice take in separate sample storage.',
      'Reset demo restores the sample.',
      'Start for real clears the demo and returns to your saved takes.',
      'It extends notes held by the sustain pedal, then cuts a repeated note at the next strike.',
      'It never moves note starts.'
    ];
    for (const sentence of repairedSentences) {
      expect(readmeText).toContain(sentence);
      expect(sentence.split(/\s+/).length).toBeLessThanOrEqual(22);
    }
    expect(readme).not.toContain('demo:rhythm-pedal-tidy');
    expect(readme).not.toContain('Expands CC64 sustain');
  });
});

describe('review-2 product language and demo repairs', () => {
  it('uses the canonical take, saved takes, repair, overlap, and sample-data terms', () => {
    expect(appSource).toContain('Import MIDI or take file');
    expect(appSource).toContain('Choose a MIDI or take file');
    expect(appSource).toContain('Saved takes');
    expect(appSource).toContain('overlap removed');
    expect(appSource).toContain('Export the cleaned take');
    expect(appSource).toContain('Cleanup accepted and saved with this take.');
    expect(readmeText).toContain('returns to your saved takes.');
    expect(readmeText).toContain('restores one take or all takes from JSON');
    expect(privacy).toContain('Delete a take from Saved takes.');
  });

  it('removes every reviewed jargon, metaphor, and unlisted preview sentence', () => {
    for (const removed of ['SIDE A / READY', 'held open by CC64', 'tangle removed', 'Ready for your DAW', 'Nice take.', 'simple synth preview']) {
      expect(appSource).not.toContain(removed);
    }
  });

  it('uses the isolated query demo entry and inventories the tempo ranges claim', () => {
    expect(appSource).toContain('href="/?demo=1"');
    expect(claims).toContain('"id": "tempo-control-ranges"');
  });

  it('ships a short verb-first catalog description', () => {
    expect(catalogDescription.length).toBeLessThanOrEqual(120);
    expect(catalogDescription).toMatch(/^Clean\b/);
  });
});

describe('review-3 cache, copy, link, and offline repairs', () => {
  it('uses literal sustain and export explanations and a literal 404 label', () => {
    const notFound = readFileSync(resolve(process.cwd(), 'public/404.html'), 'utf8');
    expect(appSource).toContain('extended while the sustain pedal was held.');
    expect(appSource).toContain('The cleaned note lengths include the sustain-pedal holds.');
    expect(appSource).not.toContain('pedal-up');
    expect(appSource).not.toContain('baked into clean note lengths');
    expect(notFound).toContain('404 / PAGE NOT FOUND');
    expect(notFound).not.toContain('END OF TAPE');
  });

  it('names GitHub before every product external repository link', () => {
    const publicPages = [
      appSource,
      privacy,
      readFileSync(resolve(process.cwd(), 'public/terms/index.html'), 'utf8'),
      readFileSync(resolve(process.cwd(), 'public/404.html'), 'utf8'),
      readFileSync(resolve(process.cwd(), 'public/offline.html'), 'utf8')
    ].join('\n');
    const links = [...publicPages.matchAll(/<a href="https:\/\/github\.com\/B-Divyesh\/sf-rhythm-pedal-tidy[^\"]*">([^<]+)<\/a>/g)];
    expect(links.length).toBeGreaterThanOrEqual(6);
    for (const link of links) expect(link[1]).toContain('GitHub');
  });

  it('uses a new build id and a verb-first catalog sentence', () => {
    expect(appSource).toContain("const BUILD_ID = 'v1.0.4'");
    expect(catalogDescription).toBe('Clean sustain-pedal overlaps, review each repair, and export practice takes without moving note starts.');
  });
});
