import { describe, expect, it } from 'vitest';
import { tempoStateFromTakeBpm, updateTempo, type TempoState } from '../src/tempo';

const initial: TempoState = { start: 80, end: 120, step: 5, current: 80 };

describe('tempo ramp validation', () => {
  it('clamps an out-of-range start before it can become the playback BPM', () => {
    const result = updateTempo(initial, 'bpm-start', '29');

    expect(result.state).toEqual({ ...initial, start: 30, current: 30 });
    expect(result.announcement).toBe('Start must be between 30 and 240 BPM. It was set to 30 BPM.');
  });

  it('restores a blank value and keeps finish at or above start', () => {
    const blank = updateTempo(initial, 'bpm-step', '');
    const finish = updateTempo({ ...initial, start: 140, current: 140 }, 'bpm-end', '120');

    expect(blank.state).toEqual(initial);
    expect(blank.announcement).toBe('Step needs a whole BPM value. It was restored to 5 BPM.');
    expect(finish.state).toEqual({ start: 140, end: 140, step: 5, current: 140 });
    expect(finish.announcement).toBe('Finish cannot be below Start. It was set to 140 BPM.');
  });

  it('bounds an imported 400 BPM take before it reaches the ramp controls', () => {
    expect(tempoStateFromTakeBpm(400)).toEqual({ start: 240, end: 300, step: 5, current: 240 });
  });
});
