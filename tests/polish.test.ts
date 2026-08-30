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
      'Start for real clears the demo and returns to your real take shelf.',
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
