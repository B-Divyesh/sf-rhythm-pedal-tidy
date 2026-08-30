import { describe, expect, it } from 'vitest';
import { parseMidi, scoreTiming, tidyTake, writeMidi } from '../src/midi';
import type { Take } from '../src/types';

const sustainedTake: Take = {
  id: 'test',
  name: 'Pedal phrase',
  createdAt: '2026-08-27T00:00:00.000Z',
  source: 'midi',
  bpm: 120,
  notes: [
    { id: 'a', pitch: 60, channel: 0, velocity: 90, startMs: 0, endMs: 220 },
    { id: 'b', pitch: 60, channel: 0, velocity: 88, startMs: 500, endMs: 720 },
    { id: 'c', pitch: 64, channel: 0, velocity: 80, startMs: 250, endMs: 400 }
  ],
  pedals: [{ timeMs: 10, down: true, channel: 0 }, { timeMs: 900, down: false, channel: 0 }]
};

describe('sustain-aware cleanup', () => {
  it('extends pedal-held notes and trims repeated pitches at the next strike', () => {
    const result = tidyTake(sustainedTake);
    const first = result.notes.find((note) => note.id === 'a')!;
    const second = result.notes.find((note) => note.id === 'b')!;
    expect(first.sustainedEndMs).toBe(900);
    expect(first.endMs).toBe(500);
    expect(first.trimmedMs).toBe(400);
    expect(second.endMs).toBe(900);
    expect(result.changedCount).toBe(1);
    expect(result.sustainedCount).toBe(3);
  });

  it('does not alter timing when the pedal is not down', () => {
    const result = tidyTake({ ...sustainedTake, pedals: [] });
    expect(result.changedCount).toBe(0);
    expect(result.notes[0]!.endMs).toBe(220);
  });

  it('repairs the verifier boundary when a take ends with CC64 held down', () => {
    const heldAtEnd: Take = {
      ...sustainedTake,
      id: 'held-at-end',
      notes: [
        { id: 'first-c4', pitch: 60, channel: 0, velocity: 90, startMs: 0, endMs: 200 },
        { id: 'second-c4', pitch: 60, channel: 0, velocity: 91, startMs: 500, endMs: 700 }
      ],
      pedals: [{ timeMs: 50, down: true, channel: 0 }]
    };

    const result = tidyTake(heldAtEnd);
    expect(result.changedCount).toBe(1);
    expect(result.sustainedCount).toBe(1);
    expect(result.overlapRemovedMs).toBe(200);
    expect(result.notes.map(({ startMs, endMs, sustainedEndMs, velocity }) => ({ startMs, endMs, sustainedEndMs, velocity }))).toEqual([
      { startMs: 0, endMs: 500, sustainedEndMs: 700, velocity: 90 },
      { startMs: 500, endMs: 700, sustainedEndMs: 700, velocity: 91 }
    ]);

    const exported = parseMidi(writeMidi(result.notes, 120).buffer as ArrayBuffer, 'held-at-end.mid');
    expect(exported.notes.map(({ startMs, endMs, velocity }) => ({ startMs, endMs, velocity }))).toEqual([
      { startMs: 0, endMs: 500, velocity: 90 },
      { startMs: 500, endMs: 700, velocity: 91 }
    ]);
  });
});

describe('MIDI export/import', () => {
  it('round-trips note starts, lengths, velocities, and tempo', () => {
    const cleaned = tidyTake(sustainedTake).notes;
    const bytes = writeMidi(cleaned, 120);
    const parsed = parseMidi(bytes.buffer as ArrayBuffer, 'roundtrip.mid');
    expect(parsed.name).toBe('roundtrip');
    expect(parsed.bpm).toBe(120);
    expect(parsed.notes).toHaveLength(3);
    expect(parsed.notes[0]!.pitch).toBe(60);
    expect(parsed.notes[0]!.endMs).toBeCloseTo(500, 0);
  });

  it('rejects a non-MIDI payload with an actionable message', () => {
    expect(() => parseMidi(new TextEncoder().encode('not midi').buffer)).toThrow(/standard MIDI/);
  });
});

describe('timing score', () => {
  it('rewards note starts close to the sixteenth grid', () => {
    const score = scoreTiming(sustainedTake.notes, 120);
    expect(score.score).toBeGreaterThan(70);
    expect(score.onGrid).toBeGreaterThan(0);
  });
});
