import type { NoteEvent, PedalEvent, Take } from './types';

export interface MidiDevice {
  id: string;
  name: string;
}

export class WebMidiRecorder {
  private access?: MIDIAccess;
  private input?: MIDIInput;
  private startedAt = 0;
  private active = new Map<string, Array<{ startMs: number; velocity: number; sequence: number }>>();
  private notes: NoteEvent[] = [];
  private pedals: PedalEvent[] = [];
  private sequence = 0;
  recording = false;

  async connect(): Promise<MidiDevice[]> {
    if (!navigator.requestMIDIAccess) throw new Error('Web MIDI is not available here. Use Chrome or Edge, or import a .mid file instead.');
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
    } catch {
      throw new Error('MIDI permission was not granted. Allow MIDI in this site’s browser settings, then connect again, or import a .mid file.');
    }
    return [...this.access.inputs.values()].map((input) => ({ id: input.id, name: input.name ?? 'MIDI input' }));
  }

  select(id: string): void {
    const input = this.access?.inputs.get(id);
    if (!input) throw new Error('That MIDI input is no longer connected.');
    if (this.input) this.input.onmidimessage = null;
    this.input = input;
  }

  start(): void {
    if (!this.input) throw new Error('Choose a MIDI input first.');
    this.notes = [];
    this.pedals = [];
    this.active.clear();
    this.sequence = 0;
    this.startedAt = performance.now();
    this.recording = true;
    this.input.onmidimessage = (event) => this.receive(event);
  }

  private receive(event: MIDIMessageEvent): void {
    const data = event.data;
    if (!this.recording || !data || data.length < 3) return;
    const status = data[0]!;
    const command = status & 0xf0;
    const channel = status & 0x0f;
    const a = data[1]!;
    const b = data[2]!;
    const timeMs = performance.now() - this.startedAt;
    const key = `${channel}:${a}`;
    if (command === 0x90 && b > 0) {
      const stack = this.active.get(key) ?? [];
      stack.push({ startMs: timeMs, velocity: b, sequence: this.sequence++ });
      this.active.set(key, stack);
    } else if (command === 0x80 || (command === 0x90 && b === 0)) {
      const on = this.active.get(key)?.shift();
      if (on) this.notes.push({ id: `live-${on.sequence}`, pitch: a, channel, velocity: on.velocity, startMs: on.startMs, endMs: timeMs });
    } else if (command === 0xb0 && a === 64) {
      this.pedals.push({ timeMs, down: b >= 64, channel });
    }
  }

  stop(bpm: number): Take {
    const stopMs = performance.now() - this.startedAt;
    this.recording = false;
    if (this.input) this.input.onmidimessage = null;
    for (const [key, stack] of this.active) {
      const [channel, pitch] = key.split(':').map(Number) as [number, number];
      for (const on of stack) this.notes.push({ id: `live-${on.sequence}`, pitch, channel, velocity: on.velocity, startMs: on.startMs, endMs: stopMs });
    }
    this.notes.sort((a, b) => a.startMs - b.startMs);
    return { id: crypto.randomUUID(), name: `Take ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, createdAt: new Date().toISOString(), source: 'web-midi', bpm, notes: this.notes, pedals: this.pedals };
  }
}
