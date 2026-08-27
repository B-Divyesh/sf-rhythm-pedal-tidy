export interface NoteEvent {
  id: string;
  pitch: number;
  channel: number;
  velocity: number;
  startMs: number;
  endMs: number;
}

export interface PedalEvent {
  timeMs: number;
  down: boolean;
  channel: number;
}

export interface Take {
  id: string;
  name: string;
  createdAt: string;
  source: 'midi' | 'web-midi' | 'sample' | 'json';
  bpm: number;
  notes: NoteEvent[];
  pedals: PedalEvent[];
  cleanedNotes?: CleanedNote[];
  accepted?: boolean;
}

export interface CleanedNote extends NoteEvent {
  originalEndMs: number;
  sustainedEndMs: number;
  trimmedMs: number;
}

export interface CleanupResult {
  notes: CleanedNote[];
  changedCount: number;
  overlapRemovedMs: number;
  sustainedCount: number;
}

export interface TimingScore {
  score: number;
  meanErrorMs: number;
  onGrid: number;
  early: number;
  late: number;
  subdivision: string;
}
