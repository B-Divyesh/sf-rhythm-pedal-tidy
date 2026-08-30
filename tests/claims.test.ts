import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Claim = { id: string; claim: string; where: string; test: string; sandbox: string };

const claims = JSON.parse(readFileSync(resolve(process.cwd(), '.factory/claims.json'), 'utf8')) as Claim[];
const browserTests = readFileSync(resolve(process.cwd(), 'tests/e2e/app.spec.ts'), 'utf8');

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
});
