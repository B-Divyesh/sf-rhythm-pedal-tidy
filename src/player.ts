import type { NoteEvent } from './types';

export class MidiPlayer {
  private context?: AudioContext;
  private timers: number[] = [];
  private oscillators: OscillatorNode[] = [];
  private stopCallback?: () => void;
  playing = false;

  async play(notes: NoteEvent[], speed: number, onProgress: (progress: number) => void, onDone: () => void): Promise<void> {
    this.stop();
    this.context ??= new AudioContext();
    await this.context.resume();
    const duration = Math.max(...notes.map((note) => note.endMs), 1) / speed;
    this.playing = true;
    this.stopCallback = onDone;
    const start = this.context.currentTime + 0.04;
    for (const note of notes) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = 440 * 2 ** ((note.pitch - 69) / 12);
      const at = start + note.startMs / 1000 / speed;
      const off = start + Math.max(note.startMs + 25, note.endMs) / 1000 / speed;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.025, note.velocity / 127 * 0.11), at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, off);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start(at);
      oscillator.stop(off + 0.02);
      this.oscillators.push(oscillator);
    }
    const started = performance.now();
    const update = () => {
      if (!this.playing) return;
      const progress = Math.min(1, (performance.now() - started) / duration);
      onProgress(progress);
      if (progress >= 1) {
        this.playing = false;
        this.stopCallback = undefined;
        onDone();
      } else this.timers.push(window.setTimeout(update, 50));
    };
    update();
  }

  stop(): void {
    const wasPlaying = this.playing;
    this.playing = false;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
    for (const oscillator of this.oscillators) {
      try { oscillator.stop(); } catch { /* already stopped */ }
    }
    this.oscillators = [];
    if (wasPlaying) this.stopCallback?.();
    this.stopCallback = undefined;
  }
}
