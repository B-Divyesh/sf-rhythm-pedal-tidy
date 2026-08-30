import { describe, expect, it } from 'vitest';
import { validateBackup } from '../src/backup';

const malformedBackup = {
  version: 1,
  takes: [{
    id: 'broken',
    name: 'Broken backup',
    createdAt: '2026-08-28T00:00:00Z',
    source: 'json',
    bpm: 120,
    notes: [{ id: 'n', pitch: 60, channel: 0, velocity: 100, startMs: 0, endMs: 100 }]
  }]
};

describe('backup validation', () => {
  it('rejects the verifier’s missing-pedals backup before it can reach IndexedDB', () => {
    expect(() => validateBackup(malformedBackup)).toThrow('That backup is invalid (take.pedals is missing). Nothing was changed.');
  });

  it('returns a safe clone of a complete backup', () => {
    const original = {
      ...malformedBackup,
      takes: [{ ...malformedBackup.takes[0]!, pedals: [], accepted: true }]
    };
    const restored = validateBackup(original);

    expect(restored).toEqual(original.takes);
    expect(restored[0]).not.toBe(original.takes[0]);
    expect(restored[0]?.notes[0]).not.toBe(original.takes[0]?.notes[0]);
  });
});
