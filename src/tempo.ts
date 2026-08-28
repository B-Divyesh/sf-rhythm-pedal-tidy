export type TempoField = 'bpm-start' | 'bpm-end' | 'bpm-step';

export type TempoState = {
  start: number;
  end: number;
  step: number;
  current: number;
};

export type TempoUpdate = {
  state: TempoState;
  announcement?: string;
};

const limits: Record<TempoField, { label: string; min: number; max: number }> = {
  'bpm-start': { label: 'Start', min: 30, max: 240 },
  'bpm-end': { label: 'Finish', min: 30, max: 300 },
  'bpm-step': { label: 'Step', min: 1, max: 30 }
};

function wholeNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim() !== '' ? Math.round(parsed) : null;
}

/**
 * Keeps the practice ramp usable even when a number input is cleared or given
 * a value outside its advertised range. Returning the announcement lets the
 * caller expose the recovery in the app's status region.
 */
export function updateTempo(state: TempoState, field: TempoField, rawValue: string): TempoUpdate {
  const limit = limits[field];
  const parsed = wholeNumber(rawValue);
  const previous = field === 'bpm-start' ? state.start : field === 'bpm-end' ? state.end : state.step;
  const requested = parsed ?? previous;
  let value = Math.max(limit.min, Math.min(limit.max, requested));
  let announcement: string | undefined;

  if (parsed === null) {
    announcement = `${limit.label} needs a whole BPM value. It was restored to ${previous} BPM.`;
  } else if (value !== parsed) {
    announcement = `${limit.label} must be between ${limit.min} and ${limit.max} BPM. It was set to ${value} BPM.`;
  } else if (value !== Number(rawValue)) {
    announcement = `${limit.label} uses whole BPM values. It was set to ${value} BPM.`;
  }

  const next = { ...state };
  if (field === 'bpm-start') {
    next.start = value;
    next.current = value;
    if (next.end < value) {
      next.end = value;
      announcement = `Finish cannot be below Start. Start and Finish are now ${value} BPM.`;
    }
  } else if (field === 'bpm-end') {
    value = Math.max(state.start, value);
    next.end = value;
    if (value !== requested && value === state.start) announcement = `Finish cannot be below Start. It was set to ${value} BPM.`;
    next.current = Math.min(next.end, Math.max(next.start, next.current));
  } else {
    next.step = value;
  }

  return { state: next, announcement };
}
