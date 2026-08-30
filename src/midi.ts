import type { CleanedNote, CleanupResult, NoteEvent, PedalEvent, Take, TimingScore } from './types';

const textDecoder = new TextDecoder();

function readVar(data: Uint8Array, cursor: { value: number }): number {
  let value = 0;
  let byte = 0;
  do {
    if (cursor.value >= data.length) throw new Error('The MIDI file ended unexpectedly.');
    byte = data[cursor.value++]!;
    value = (value << 7) | (byte & 0x7f);
  } while (byte & 0x80);
  return value;
}

type TickEvent =
  | { tick: number; kind: 'noteOn' | 'noteOff'; channel: number; pitch: number; velocity: number }
  | { tick: number; kind: 'pedal'; channel: number; down: boolean }
  | { tick: number; kind: 'tempo'; micros: number };

export function parseMidi(buffer: ArrayBuffer, fileName = 'Imported take'): Take {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (bytes.length < 14 || textDecoder.decode(bytes.slice(0, 4)) !== 'MThd') {
    throw new Error('That file is not a standard MIDI file (.mid).');
  }
  const headerLength = view.getUint32(4, false);
  const trackCount = view.getUint16(10, false);
  const division = view.getUint16(12, false);
  if (division & 0x8000) throw new Error('SMPTE-timed MIDI is not supported yet. Export with PPQ timing.');
  let offset = 8 + headerLength;
  const events: TickEvent[] = [];

  for (let track = 0; track < trackCount; track++) {
    if (textDecoder.decode(bytes.slice(offset, offset + 4)) !== 'MTrk') throw new Error('A MIDI track is malformed.');
    const length = view.getUint32(offset + 4, false);
    const end = offset + 8 + length;
    if (end > bytes.length) throw new Error('A MIDI track is cut short.');
    const cursor = { value: offset + 8 };
    let tick = 0;
    let runningStatus = 0;
    while (cursor.value < end) {
      tick += readVar(bytes, cursor);
      let status = bytes[cursor.value++]!;
      if (status < 0x80) {
        cursor.value--;
        status = runningStatus;
      } else if (status < 0xf0) runningStatus = status;
      if (status === 0xff) {
        const meta = bytes[cursor.value++]!;
        const size = readVar(bytes, cursor);
        if (meta === 0x51 && size === 3) {
          const micros = (bytes[cursor.value]! << 16) | (bytes[cursor.value + 1]! << 8) | bytes[cursor.value + 2]!;
          events.push({ tick, kind: 'tempo', micros });
        }
        cursor.value += size;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) {
        cursor.value += readVar(bytes, cursor);
        continue;
      }
      const command = status & 0xf0;
      const channel = status & 0x0f;
      const a = bytes[cursor.value++]!;
      if (command === 0xc0 || command === 0xd0) continue;
      const b = bytes[cursor.value++]!;
      if (command === 0x90 && b > 0) events.push({ tick, kind: 'noteOn', channel, pitch: a, velocity: b });
      else if (command === 0x80 || (command === 0x90 && b === 0)) events.push({ tick, kind: 'noteOff', channel, pitch: a, velocity: b });
      else if (command === 0xb0 && a === 64) events.push({ tick, kind: 'pedal', channel, down: b >= 64 });
    }
    offset = end;
  }

  events.sort((a, b) => a.tick - b.tick || (a.kind === 'tempo' ? -1 : 0));
  const tempoEvents = events.filter((e): e is Extract<TickEvent, { kind: 'tempo' }> => e.kind === 'tempo');
  if (!tempoEvents.length || tempoEvents[0]!.tick !== 0) tempoEvents.unshift({ tick: 0, kind: 'tempo', micros: 500000 });
  function tickToMs(target: number): number {
    let micros = 0;
    let previousTick = 0;
    let tempo = 500000;
    for (const event of tempoEvents) {
      if (event.tick > target) break;
      micros += ((event.tick - previousTick) * tempo) / division;
      previousTick = event.tick;
      tempo = event.micros;
    }
    return (micros + ((target - previousTick) * tempo) / division) / 1000;
  }

  const active = new Map<string, Array<{ tick: number; velocity: number; sequence: number }>>();
  const notes: NoteEvent[] = [];
  const pedals: PedalEvent[] = [];
  let sequence = 0;
  for (const event of events) {
    if (event.kind === 'noteOn') {
      const key = `${event.channel}:${event.pitch}`;
      const stack = active.get(key) ?? [];
      stack.push({ tick: event.tick, velocity: event.velocity, sequence: sequence++ });
      active.set(key, stack);
    } else if (event.kind === 'noteOff') {
      const key = `${event.channel}:${event.pitch}`;
      const on = active.get(key)?.shift();
      if (on) notes.push({ id: `n${on.sequence}`, pitch: event.pitch, channel: event.channel, velocity: on.velocity, startMs: tickToMs(on.tick), endMs: tickToMs(event.tick) });
    } else if (event.kind === 'pedal') {
      pedals.push({ timeMs: tickToMs(event.tick), down: event.down, channel: event.channel });
    }
  }
  const lastMs = Math.max(500, ...events.map((event) => tickToMs(event.tick)));
  for (const [key, stack] of active) {
    const [channel, pitch] = key.split(':').map(Number) as [number, number];
    for (const on of stack) notes.push({ id: `n${on.sequence}`, pitch, channel, velocity: on.velocity, startMs: tickToMs(on.tick), endMs: lastMs });
  }
  notes.sort((a, b) => a.startMs - b.startMs || a.pitch - b.pitch);
  const bpm = Math.round(60000000 / tempoEvents[0]!.micros);
  return { id: crypto.randomUUID(), name: fileName.replace(/\.midi?$/i, ''), createdAt: new Date().toISOString(), source: 'midi', bpm, notes, pedals };
}

function pedalReleaseAfter(note: NoteEvent, pedals: PedalEvent[], takeEndMs: number): number {
  const channelPedals = pedals.filter((p) => p.channel === note.channel).sort((a, b) => a.timeMs - b.timeMs);
  let down = false;
  for (const pedal of channelPedals) {
    if (pedal.timeMs <= note.endMs) down = pedal.down;
    else if (down && !pedal.down) return pedal.timeMs;
  }
  // A recording can stop before the player releases CC64. In that case the
  // only honest boundary is the end of the captured take. Extending to that
  // boundary preserves sustain through a later same-pitch strike, where the
  // normal overlap rule can make the clean cut.
  return down ? Math.max(note.endMs, takeEndMs) : note.endMs;
}

export function tidyTake(take: Take): CleanupResult {
  const takeEndMs = Math.max(0, ...take.notes.map((note) => note.endMs), ...take.pedals.map((pedal) => pedal.timeMs));
  const groups = new Map<string, NoteEvent[]>();
  for (const note of take.notes) {
    const key = `${note.channel}:${note.pitch}`;
    groups.set(key, [...(groups.get(key) ?? []), note]);
  }
  const output: CleanedNote[] = [];
  let changedCount = 0;
  let overlapRemovedMs = 0;
  let sustainedCount = 0;
  for (const group of groups.values()) {
    group.sort((a, b) => a.startMs - b.startMs);
    group.forEach((note, index) => {
      const sustainedEnd = Math.max(note.endMs, pedalReleaseAfter(note, take.pedals, takeEndMs));
      if (sustainedEnd > note.endMs + 0.5) sustainedCount++;
      const next = group[index + 1];
      const endMs = next && next.startMs < sustainedEnd ? Math.max(note.startMs + 10, next.startMs) : sustainedEnd;
      const trimmedMs = Math.max(0, sustainedEnd - endMs);
      if (trimmedMs > 0.5) {
        changedCount++;
        overlapRemovedMs += trimmedMs;
      }
      output.push({ ...note, endMs, originalEndMs: note.endMs, sustainedEndMs: sustainedEnd, trimmedMs });
    });
  }
  output.sort((a, b) => a.startMs - b.startMs || a.pitch - b.pitch);
  return { notes: output, changedCount, overlapRemovedMs, sustainedCount };
}

export function scoreTiming(notes: NoteEvent[], bpm: number, subdivision = 4): TimingScore {
  if (!notes.length) return { score: 0, meanErrorMs: 0, onGrid: 0, early: 0, late: 0, subdivision: 'sixteenth notes' };
  const grid = 60000 / bpm / subdivision;
  let errorTotal = 0;
  let early = 0;
  let late = 0;
  let onGrid = 0;
  for (const note of notes) {
    const nearest = Math.round(note.startMs / grid) * grid;
    const error = note.startMs - nearest;
    errorTotal += Math.abs(error);
    if (Math.abs(error) <= 35) onGrid++;
    else if (error < 0) early++;
    else late++;
  }
  const meanErrorMs = errorTotal / notes.length;
  const score = Math.max(0, Math.round(100 - (meanErrorMs / (grid / 2)) * 55));
  return { score, meanErrorMs, onGrid, early, late, subdivision: 'sixteenth notes' };
}

function varInt(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];
  while ((value >>= 7)) buffer = (buffer << 8) | ((value & 0x7f) | 0x80);
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

export function writeMidi(notes: NoteEvent[], bpm: number): Uint8Array {
  const ppq = 480;
  const msPerTick = 60000 / bpm / ppq;
  const tempo = Math.round(60000000 / bpm);
  const events: Array<{ tick: number; order: number; bytes: number[] }> = [{ tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff] }];
  for (const note of notes) {
    events.push({ tick: Math.round(note.startMs / msPerTick), order: 1, bytes: [0x90 | note.channel, note.pitch, note.velocity] });
    events.push({ tick: Math.max(Math.round(note.startMs / msPerTick) + 1, Math.round(note.endMs / msPerTick)), order: 0, bytes: [0x80 | note.channel, note.pitch, 0] });
  }
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const track: number[] = [];
  let previous = 0;
  for (const event of events) {
    track.push(...varInt(event.tick - previous), ...event.bytes);
    previous = event.tick;
  }
  track.push(0, 0xff, 0x2f, 0);
  const result = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (ppq >> 8) & 0xff, ppq & 0xff, 0x4d, 0x54, 0x72, 0x6b, (track.length >>> 24) & 0xff, (track.length >>> 16) & 0xff, (track.length >>> 8) & 0xff, track.length & 0xff, ...track];
  return new Uint8Array(result);
}

export function sampleTake(): Take {
  const notes: NoteEvent[] = [60, 60, 62, 64, 64, 67, 65, 64].map((pitch, index) => ({ id: `sample-${index}`, pitch, channel: 0, velocity: 72 + (index % 3) * 9, startMs: index * 500 + (index % 2 ? 18 : 0), endMs: index * 500 + 310 }));
  return { id: crypto.randomUUID(), name: 'Warm-up in C', createdAt: new Date().toISOString(), source: 'sample', bpm: 120, notes, pedals: [{ timeMs: 80, down: true, channel: 0 }, { timeMs: 1480, down: false, channel: 0 }, { timeMs: 1550, down: true, channel: 0 }, { timeMs: 3650, down: false, channel: 0 }] };
}
