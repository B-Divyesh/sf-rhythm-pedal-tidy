import type { CleanedNote, NoteEvent, PedalEvent, Take } from './types';

type JsonRecord = Record<string, unknown>;

const sources = new Set<Take['source']>(['midi', 'web-midi', 'sample', 'json']);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(kind: 'backup' | 'take', detail: string): never {
  const label = kind === 'backup' ? 'backup' : 'take JSON';
  throw new Error(`That ${label} is invalid (${detail}). Nothing was changed.`);
}

function record(value: unknown, kind: 'backup' | 'take', path: string): JsonRecord {
  if (!isRecord(value)) invalid(kind, `${path} must be an object`);
  return value;
}

function text(value: unknown, kind: 'backup' | 'take', path: string): string {
  if (typeof value !== 'string' || !value.trim()) invalid(kind, `${path} is missing`);
  return value;
}

function number(value: unknown, kind: 'backup' | 'take', path: string, min: number, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) invalid(kind, `${path} is out of range`);
  return value;
}

function integer(value: unknown, kind: 'backup' | 'take', path: string, min: number, max: number): number {
  const parsed = number(value, kind, path, min, max);
  if (!Number.isInteger(parsed)) invalid(kind, `${path} must be a whole number`);
  return parsed;
}

function note(value: unknown, kind: 'backup' | 'take', path: string): NoteEvent {
  const input = record(value, kind, path);
  const startMs = number(input.startMs, kind, `${path}.startMs`, 0);
  const endMs = number(input.endMs, kind, `${path}.endMs`, startMs);
  return {
    id: text(input.id, kind, `${path}.id`),
    pitch: integer(input.pitch, kind, `${path}.pitch`, 0, 127),
    channel: integer(input.channel, kind, `${path}.channel`, 0, 15),
    velocity: integer(input.velocity, kind, `${path}.velocity`, 1, 127),
    startMs,
    endMs
  };
}

function pedal(value: unknown, kind: 'backup' | 'take', path: string): PedalEvent {
  const input = record(value, kind, path);
  if (typeof input.down !== 'boolean') invalid(kind, `${path}.down is missing`);
  return {
    timeMs: number(input.timeMs, kind, `${path}.timeMs`, 0),
    down: input.down,
    channel: integer(input.channel, kind, `${path}.channel`, 0, 15)
  };
}

function cleanedNote(value: unknown, kind: 'backup' | 'take', path: string): CleanedNote {
  const input = record(value, kind, path);
  const original = note(input, kind, path);
  const originalEndMs = number(input.originalEndMs, kind, `${path}.originalEndMs`, original.startMs);
  const sustainedEndMs = number(input.sustainedEndMs, kind, `${path}.sustainedEndMs`, originalEndMs);
  return {
    ...original,
    originalEndMs,
    sustainedEndMs,
    trimmedMs: number(input.trimmedMs, kind, `${path}.trimmedMs`, 0)
  };
}

/**
 * Convert untrusted exported JSON to the exact shape the renderer and MIDI
 * cleanup expect. The clone also prevents a parsed object from being stored
 * with fields the app never understands.
 */
export function validateImportedTake(value: unknown, kind: 'backup' | 'take' = 'take'): Take {
  const input = record(value, kind, 'take');
  const createdAt = text(input.createdAt, kind, 'take.createdAt');
  if (Number.isNaN(Date.parse(createdAt))) invalid(kind, 'take.createdAt is not a date');
  if (!sources.has(input.source as Take['source'])) invalid(kind, 'take.source is not recognized');
  if (!Array.isArray(input.notes) || !input.notes.length) invalid(kind, 'take.notes must contain at least one note');
  if (!Array.isArray(input.pedals)) invalid(kind, 'take.pedals is missing');
  if (input.accepted !== undefined && typeof input.accepted !== 'boolean') invalid(kind, 'take.accepted is invalid');
  if (input.cleanedNotes !== undefined && !Array.isArray(input.cleanedNotes)) invalid(kind, 'take.cleanedNotes is invalid');

  const take: Take = {
    id: text(input.id, kind, 'take.id'),
    name: text(input.name, kind, 'take.name'),
    createdAt,
    source: input.source as Take['source'],
    bpm: number(input.bpm, kind, 'take.bpm', 1),
    notes: input.notes.map((item, index) => note(item, kind, `take.notes[${index}]`)),
    pedals: input.pedals.map((item, index) => pedal(item, kind, `take.pedals[${index}]`))
  };
  if (input.cleanedNotes) take.cleanedNotes = input.cleanedNotes.map((item, index) => cleanedNote(item, kind, `take.cleanedNotes[${index}]`));
  if (input.accepted !== undefined) take.accepted = input.accepted;
  return take;
}

/** Validate every record before any IndexedDB write is allowed. */
export function validateBackup(value: unknown): Take[] {
  const input = record(value, 'backup', 'backup');
  if (input.version !== 1) invalid('backup', 'backup.version must be 1');
  if (!Array.isArray(input.takes)) invalid('backup', 'backup.takes is missing');
  const takes = input.takes.map((item) => validateImportedTake(item, 'backup'));
  const ids = new Set(takes.map((take) => take.id));
  if (ids.size !== takes.length) invalid('backup', 'backup contains duplicate take IDs');
  return takes;
}
