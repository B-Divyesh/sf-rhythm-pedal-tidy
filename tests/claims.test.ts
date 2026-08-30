import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Claim = { id: string; claim: string; where: string; test: string; sandbox: string };

const claims = JSON.parse(readFileSync(resolve(process.cwd(), '.factory/claims.json'), 'utf8')) as Claim[];
const browserTests = readFileSync(resolve(process.cwd(), 'tests/e2e/app.spec.ts'), 'utf8');
const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { scripts: Record<string, string> };

const publicPromiseIds = [
  'demo-isolation',
  'pedal-overlap-repair',
  'standard-midi-import',
  'live-midi-input',
  'timing-score',
  'tempo-ramp',
  'midi-export',
  'json-data-roundtrip',
  'saved-take-history',
  'offline-reload',
  'local-processing',
  'no-checkout'
];

describe('published claims contract', () => {
  it('gives every published claim one runnable, claim-tagged sandbox test', () => {
    expect(claims.length).toBeGreaterThan(0);
    expect(new Set(claims.map((claim) => claim.id)).size).toBe(claims.length);
    for (const claim of claims) {
      expect(claim.id).toMatch(/^[a-z0-9-]+$/);
      expect(claim.claim.length).toBeGreaterThan(12);
      expect(claim.where.length).toBeGreaterThan(3);
      expect(claim.sandbox.length).toBeGreaterThan(12);
      expect(claim.test).toContain(`@claim:${claim.id}`);
      expect(claim.test).toContain('npm run test:e2e');
      expect(browserTests.match(new RegExp(`@claim:${claim.id}`, 'g'))).toHaveLength(1);
    }
  });

  it('inventories every public product promise reviewed for this release', () => {
    expect(claims.map((claim) => claim.id).sort()).toEqual([...publicPromiseIds].sort());
  });

  it('builds the production app inside every exact browser claim command', () => {
    expect(packageJson.scripts['test:e2e']).toMatch(/^npm run build && playwright test$/);
    expect(claims.every((claim) => claim.test.startsWith('npm run test:e2e -- --grep @claim:'))).toBe(true);
  });
});
