import './style.css';
import { parseMidi, sampleTake, scoreTiming, tidyTake, writeMidi } from './midi';
import { MidiPlayer } from './player';
import { WebMidiRecorder, type MidiDevice } from './recorder';
import { createTakeStorage, type TakeStorage } from './storage';
import { tempoStateFromTakeBpm, updateTempo, type TempoField } from './tempo';
import { validateBackup, validateImportedTake } from './backup';
import type { CleanedNote, NoteEvent, Take } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const player = new MidiPlayer();
const recorder = new WebMidiRecorder();
let current: Take | null = null;
let takes: Take[] = [];
let devices: MidiDevice[] = [];
let selectedDevice = '';
let bpmStart = 80;
let bpmEnd = 120;
let bpmStep = 5;
let currentBpm = 80;
let playProgress = 0;
let message = '';
let messageType: 'status' | 'error' = 'status';
let offline = !navigator.onLine;
let pendingTempoTabFocus: string | undefined;
let demoMode = new URL(location.href).pathname.replace(/\/+$/, '') === '/demo' || new URL(location.href).searchParams.get('demo') === '1';
let takeStorage: TakeStorage = createTakeStorage(demoMode ? 'demo' : 'real');

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
}

function noteName(pitch: number): string {
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  return `${names[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}

function download(data: BlobPart, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function duration(notes: NoteEvent[]): number {
  return Math.max(1, ...notes.map((note) => note.endMs));
}

function timeline(notes: NoteEvent[], cleaned: boolean): string {
  if (!notes.length) return '<p class="timeline-empty">No note events were found.</p>';
  const high = Math.max(...notes.map((note) => note.pitch));
  const low = Math.min(...notes.map((note) => note.pitch));
  const rows = Math.max(8, high - low + 1);
  const length = duration(notes);
  const blocks = notes.map((note) => {
    const item = note as CleanedNote;
    const left = note.startMs / length * 100;
    const width = Math.max(0.7, (note.endMs - note.startMs) / length * 100);
    const top = (high - note.pitch) / rows * 100;
    const removedWidth = cleaned && item.trimmedMs ? item.trimmedMs / length * 100 : 0;
    return `<span class="note-block ${cleaned ? 'is-clean' : ''}" style="--x:${left}%;--w:${width}%;--y:${top}%;--v:${note.velocity / 127}" title="${noteName(note.pitch)}, ${(note.endMs - note.startMs).toFixed(0)} ms"></span>${removedWidth ? `<span class="trim-block" style="--x:${left + width}%;--w:${removedWidth}%;--y:${top}%" title="Removed ${item.trimmedMs.toFixed(0)} ms overlap"></span>` : ''}`;
  }).join('');
  return `<div class="roll" role="img" aria-label="${cleaned ? 'After cleanup' : 'Before cleanup'} piano roll with ${notes.length} notes, pitches ${noteName(low)} to ${noteName(high)}"><div class="playhead" style="--play:${playProgress * 100}%"></div>${blocks}</div>`;
}

function renderWorkspace(): string {
  if (!current) {
    return `<section class="empty-state" aria-labelledby="empty-title">
      <span class="tape-number">SIDE A / READY</span>
      <h2 id="empty-title">Bring in a pedal take</h2>
      <p>Import a Standard MIDI file from any DAW or keyboard. We’ll find notes held open by CC64 and show every suggested cut before you export.</p>
      <div class="action-row">
        <button class="primary" data-action="import">Import MIDI or session</button>
        <a class="secondary button-link" href="/demo">Try it with sample data</a>
      </div>
      <p class="fineprint">Use .mid import when live Web MIDI is not available in your browser.</p>
    </section>`;
  }
  const result = tidyTake(current);
  const cleaned = current.cleanedNotes ?? result.notes;
  const score = scoreTiming(cleaned, current.bpm);
  const accepted = current.accepted === true;
  return `<section class="workbench" aria-labelledby="take-title">
    <div class="take-heading">
      <div><span class="tape-number">${escapeHtml(current.source.toUpperCase())} / ${new Date(current.createdAt).toLocaleDateString()}</span><h2 id="take-title" tabindex="-1">${escapeHtml(current.name)}</h2></div>
      <button class="text-button danger-text" data-action="remove-current">Remove take</button>
    </div>
    <div class="stats-strip" aria-label="Take summary">
      <div><strong>${current.notes.length}</strong><span>notes</span></div>
      <div><strong>${current.pedals.filter((p) => p.down).length}</strong><span>pedal presses</span></div>
      <div><strong>${result.changedCount}</strong><span>overlaps found</span></div>
      <div><strong>${(result.overlapRemovedMs / 1000).toFixed(2)}s</strong><span>tangle removed</span></div>
    </div>
    <div class="diff-heading">
      <div><span class="eyebrow">Pedal-aware repair</span><h3>${result.changedCount ? `${result.changedCount} clean cut${result.changedCount === 1 ? '' : 's'} suggested` : 'Already tidy'}</h3></div>
      <div class="legend"><span class="key before-key">Original</span><span class="key clean-key">Kept</span><span class="key trim-key">Removed overlap</span></div>
    </div>
    <div class="diff-stack">
      <div class="roll-row"><span>Before</span>${timeline(current.notes.map((note) => ({ ...note, endMs: (result.notes.find((n) => n.id === note.id)?.sustainedEndMs ?? note.endMs) })), false)}</div>
      <div class="roll-row"><span>After</span>${timeline(cleaned, true)}</div>
    </div>
    <p class="explanation">${result.sustainedCount} note release${result.sustainedCount === 1 ? '' : 's'} extended to pedal-up. Repeated pitches are then cut at the next strike; timing and velocity stay untouched.</p>
    <div class="approval-bar ${accepted ? 'accepted' : ''}">
      <div><strong>${accepted ? 'Cleanup accepted' : 'Does this repair look right?'}</strong><span>${accepted ? 'Your acceptance is stored only on this device.' : 'Accepting helps you track whether the pass needed manual work.'}</span></div>
      <button class="${accepted ? 'secondary' : 'primary'}" data-action="accept">${accepted ? 'Accepted ✓' : 'Accept cleanup'}</button>
    </div>
    <div class="practice-grid">
      <section class="score-panel" aria-labelledby="score-title">
        <span class="eyebrow">Timing card · ${score.subdivision}</span>
        <div class="score-lockup"><strong>${score.score}</strong><div><h3 id="score-title">Timing score</h3><span>Mean offset ${score.meanErrorMs.toFixed(0)} ms</span></div></div>
        <div class="score-breakdown"><span>On grid <b>${score.onGrid}</b></span><span>Early <b>${score.early}</b></span><span>Late <b>${score.late}</b></span></div>
        <p>Score measures note starts against the nearest sixteenth-note pulse. It is feedback, not a judgment of feel.</p>
      </section>
      <section class="ramp-panel" aria-labelledby="ramp-title">
        <span class="eyebrow">Practice replay</span>
        <h3 id="ramp-title">Tempo ramp</h3>
        <div class="tempo-readout"><strong>${currentBpm}</strong><span>BPM now</span></div>
        <div class="field-row">
          <label>Start <input data-field="bpm-start" type="number" min="30" max="240" step="1" value="${bpmStart}" aria-describedby="tempo-guidance" /></label>
          <label>Finish <input data-field="bpm-end" type="number" min="${bpmStart}" max="300" step="1" value="${bpmEnd}" aria-describedby="tempo-guidance" /></label>
          <label>Step <input data-field="bpm-step" type="number" min="1" max="30" step="1" value="${bpmStep}" aria-describedby="tempo-guidance" /></label>
        </div>
        <div class="transport">
          <button class="play-button" data-action="play" aria-pressed="${player.playing}">${player.playing ? '■ Stop replay' : '▶ Replay clean take'}</button>
          <button class="secondary compact" data-action="reset-tempo">Reset tempo</button>
        </div>
        <p id="tempo-guidance">Start is 30–240 BPM, Finish is ${bpmStart}–300 BPM, and Step is 1–30 BPM. Each completed replay adds ${bpmStep} BPM, up to ${bpmEnd}. Playback is a simple synth preview.</p>
      </section>
    </div>
    <div class="export-bar">
      <div><strong>Ready for your DAW</strong><span>Pedal sustain is baked into clean note lengths.</span></div>
      <button class="primary" data-action="export-midi">Export cleaned MIDI</button>
      <button class="secondary" data-action="export-json">Export session</button>
    </div>
  </section>`;
}

function renderHistory(): string {
  if (!takes.length) return '<p class="muted">Your first take will appear here and survive refreshes.</p>';
  return `<ul class="take-list">${takes.map((take) => `<li class="${take.id === current?.id ? 'selected' : ''}"><button data-open="${take.id}"><strong>${escapeHtml(take.name)}</strong><span>${take.notes.length} notes · ${new Date(take.createdAt).toLocaleString()}</span></button><button class="delete-take" data-delete="${take.id}" aria-label="Delete ${escapeHtml(take.name)}">×</button></li>`).join('')}</ul>`;
}

function focusSelector(element: Element | null): string | undefined {
  if (!(element instanceof HTMLElement)) return undefined;
  if (element.id) return `#${CSS.escape(element.id)}`;
  const action = element.dataset.action;
  if (action) return `[data-action="${CSS.escape(action)}"]`;
  const field = element.dataset.field;
  if (field) return `[data-field="${CSS.escape(field)}"]`;
  const open = element.dataset.open;
  if (open) return `[data-open="${CSS.escape(open)}"]`;
  const remove = element.dataset.delete;
  if (remove) return `[data-delete="${CSS.escape(remove)}"]`;
  return undefined;
}

function render(preferredFocus?: string, deferFocus = false): void {
  const focus = preferredFocus ?? focusSelector(document.activeElement);
  document.title = demoMode ? 'Demo — Rhythm Pedal Tidy' : 'Rhythm Pedal Tidy — clean sustain MIDI offline';
  app.innerHTML = `<header class="site-header">
    <a class="brand" href="/" aria-label="Rhythm Pedal Tidy home"><span class="brand-mark" aria-hidden="true">RPT</span><span>Rhythm Pedal Tidy</span></a>
    <nav aria-label="Main navigation"><a href="/demo">Demo</a><a href="#workspace">Workspace</a><a href="#takes">Takes</a><a href="/privacy/">Privacy</a></nav>
    <span class="privacy-stamp">LOCAL ONLY</span>
  </header>
  ${demoMode ? `<section class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved to your real takes.</strong><div><button class="secondary compact" data-action="reset-demo">Reset demo</button><button class="text-button demo-exit" data-action="start-real">Start for real</button></div></section>` : ''}
  ${offline ? '<div class="offline-banner" role="status">Offline deck: imports, cleanup, replay, and exports still work.</div>' : ''}
  <main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy"><span class="kicker">MIDI cleanup for practice takes</span><h1 id="hero-title">Clean sustain-pedal<br><em>MIDI overlaps.</em></h1><p>For keyboard and e-kit players who need clean practice takes without changing timing.</p><a class="primary button-link" href="/demo">Try it with sample data</a><span class="action-explainer">Loads an 8-note practice take right away.</span><ul class="hero-facts"><li>Your MIDI stays on this device.</li><li>Works offline after the first visit.</li><li>Export cleaned MIDI free.</li></ul></div>
      <picture class="hero-art"><source type="image/webp" media="(max-width: 700px)" srcset="/assets/pedal-tape-hero-720.webp"><source type="image/avif" srcset="/assets/pedal-tape-hero.avif"><source type="image/webp" srcset="/assets/pedal-tape-hero.webp"><img src="/assets/pedal-tape-hero.jpg" width="1200" height="800" alt="Risograph collage of a sustain pedal connected to a cassette and tidy piano-roll strip" decoding="async" fetchpriority="high"></picture>
      <div class="hero-note" aria-label="How it works"><b>01</b> capture <span>→</span> <b>02</b> inspect <span>→</span> <b>03</b> export</div>
    </section>
    <section class="input-deck" id="workspace" aria-labelledby="input-title">
      <div class="section-label"><span>INPUT / 01</span><h2 id="input-title">Load the take</h2></div>
      <div class="input-controls">
        <button class="primary" data-action="import">↑ Import .mid or session</button>
        <div class="live-midi">
          <button class="secondary" data-action="connect">${devices.length ? 'Refresh MIDI inputs' : 'Connect live MIDI'}</button>
          ${devices.length ? `<label>Input <select data-field="device"><option value="">Choose an input</option>${devices.map((device) => `<option value="${device.id}" ${device.id === selectedDevice ? 'selected' : ''}>${escapeHtml(device.name)}</option>`).join('')}</select></label><button class="record-button ${recorder.recording ? 'recording' : ''}" data-action="record">${recorder.recording ? '■ Stop take' : '● Record take'}</button>` : ''}
        </div>
      </div>
      <input class="visually-hidden" id="file-input" tabindex="-1" aria-label="Choose a MIDI or session file" type="file" accept=".mid,.midi,.json,audio/midi,application/json" />
    </section>
    <div id="announcer" class="status-line ${messageType}" role="status" aria-live="polite">${escapeHtml(message)}</div>
    ${renderWorkspace()}
    <section class="history-section" id="takes" aria-labelledby="takes-title">
      <div class="section-label"><span>ARCHIVE / 02</span><h2 id="takes-title">Take shelf</h2></div>
      <div class="history-layout"><div>${renderHistory()}</div><div class="data-tools"><p>Back up every locally saved take in one portable JSON file.</p><div class="action-row"><button class="secondary" data-action="backup">Export all data</button><button class="text-button" data-action="import">Import backup</button></div></div></div>
    </section>
    <section class="unlock-section" id="use-notes" aria-labelledby="use-notes-title">
      <div class="price-sticker"><span>FULL TOOL</span><strong>FREE</strong><small>No checkout</small></div>
      <div><span class="eyebrow">Use on your device</span><h2 id="use-notes-title">Bring in your own MIDI.</h2><p>Import a file or connect a compatible MIDI input. Review the repair before exporting the cleaned take.</p><ul><li>Local MIDI import and export</li><li>Live Web MIDI when your browser supports it</li><li>Saved take history on this device</li></ul><p class="fineprint">No account, payment, or performance-data upload is used in this build.</p></div>
      <div class="buy-panel"><strong class="unlocked">No checkout in this build</strong><p>All available controls are ready to use. Read the privacy page to see what stays on your device.</p><a class="secondary button-link" href="/privacy/">Read privacy</a></div>
    </section>
  </main>
  <footer><div><strong>Rhythm Pedal Tidy</strong><span>Made for the gap between practice and the piano roll.</span></div><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-rhythm-pedal-tidy">Source</a></nav><p>All processing stays on this device. Hero artwork is original AI-assisted risograph art.</p></footer>
  <div id="update-toast" class="update-toast" hidden><span>A fresh version is ready.</span><button data-action="update">Update now</button></div>`;
  bindEvents();
  if (focus) {
    const restore = () => document.querySelector<HTMLElement>(focus)?.focus({ preventScroll: true });
    if (deferFocus) requestAnimationFrame(restore);
    else restore();
  }
}

async function persist(take: Take): Promise<void> {
  await takeStorage.saveTake(take);
  takes = await takeStorage.listTakes();
}

async function loadTake(take: Take, announcement: string): Promise<void> {
  if (!take.notes.length) throw new Error('No note events were found in that take.');
  const result = tidyTake(take);
  current = { ...take, cleanedNotes: result.notes };
  ({ start: bpmStart, end: bpmEnd, step: bpmStep, current: currentBpm } = tempoStateFromTakeBpm(current.bpm));
  await persist(current);
  messageType = 'status';
  message = announcement;
  render('#take-title');
  document.querySelector('#take-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function handleFile(file: File): Promise<void> {
  if (file.size > 20 * 1024 * 1024) throw new Error('That file is over 20 MB. Split the take and try again.');
  if (file.name.toLowerCase().endsWith('.json')) {
    let parsed: unknown;
    try { parsed = JSON.parse(await file.text()); } catch { throw new Error('That JSON file could not be read. Choose an exported session or backup.'); }
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && 'takes' in parsed) {
      const restored = validateBackup(parsed);
      if (takes.length && !confirm(`Restore ${restored.length} take${restored.length === 1 ? '' : 's'}? This replaces ${takes.length} take${takes.length === 1 ? '' : 's'} currently saved on this device.`)) {
        messageType = 'status';
        message = 'Backup restore was cancelled. Your saved takes were not changed.';
        render();
        return;
      }
      await takeStorage.replaceAllTakes(restored);
      takes = await takeStorage.listTakes();
      current = takes[0] ?? null;
      message = `Restored ${takes.length} ${demoMode ? 'demo ' : ''}take${takes.length === 1 ? '' : 's'}.`;
      render();
      return;
    }
    const session = validateImportedTake(parsed);
    await loadTake({ ...session, id: crypto.randomUUID(), source: 'json', createdAt: new Date().toISOString() }, 'Session imported and cleaned.');
    return;
  }
  await loadTake(parseMidi(await file.arrayBuffer(), file.name), 'MIDI imported. Cleanup suggestions are ready.');
}

function bindEvents(): void {
  document.querySelectorAll<HTMLElement>('[data-action]').forEach((element) => element.addEventListener('click', async () => {
    const action = element.dataset.action;
    try {
      if (action === 'import') document.querySelector<HTMLInputElement>('#file-input')?.click();
      else if (action === 'reset-demo' && demoMode) {
        await takeStorage.clearAllTakes();
        takes = [];
        current = null;
        await loadTake(sampleTake(), 'Demo reset. The sample take is ready again.');
      } else if (action === 'start-real' && demoMode) {
        await takeStorage.clearAllTakes();
        location.assign('/');
        return;
      } else if (action === 'connect') {
        devices = await recorder.connect();
        message = devices.length ? `${devices.length} MIDI input${devices.length === 1 ? '' : 's'} found.` : 'No MIDI inputs found. Connect a device, then refresh inputs.';
        render();
      } else if (action === 'record') {
        if (recorder.recording) {
          const take = recorder.stop(currentBpm);
          if (!take.notes.length) { message = 'No notes were received. Check the selected input and try again.'; messageType = 'error'; render(); }
          else await loadTake(take, 'Live take captured and cleaned.');
        } else {
          if (!selectedDevice) throw new Error('Choose a MIDI input before recording.');
          recorder.select(selectedDevice);
          recorder.start();
          message = 'Recording. Play now; pedal CC64 is being captured.';
          render();
        }
      } else if (action === 'accept' && current) {
        current.accepted = true;
        await persist(current);
        message = 'Cleanup accepted. Nice take.';
        render();
      } else if (action === 'play' && current) {
        if (player.playing) { player.stop(); playProgress = 0; render(); }
        else {
          const notes = current.cleanedNotes ?? tidyTake(current).notes;
          const speed = currentBpm / current.bpm;
          await player.play(notes, speed, (value) => { playProgress = value; document.querySelectorAll<HTMLElement>('.playhead').forEach((node) => node.style.setProperty('--play', `${value * 100}%`)); }, () => { playProgress = 0; currentBpm = Math.min(bpmEnd, currentBpm + bpmStep); message = currentBpm === bpmEnd ? `Replay complete. You reached ${bpmEnd} BPM.` : `Replay complete. Next pass: ${currentBpm} BPM.`; render(); });
          render();
        }
      } else if (action === 'reset-tempo') { currentBpm = bpmStart; message = `Tempo reset to ${currentBpm} BPM.`; render(); }
      else if (action === 'export-midi' && current) {
        download(writeMidi(current.cleanedNotes ?? tidyTake(current).notes, current.bpm).buffer as ArrayBuffer, `${current.name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}-tidy.mid`, 'audio/midi');
        message = 'Cleaned MIDI exported.'; render();
      } else if (action === 'export-json' && current) {
        download(JSON.stringify(current, null, 2), `${current.name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.json`, 'application/json');
      } else if (action === 'backup') {
        download(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), takes }, null, 2), 'rhythm-pedal-tidy-backup.json', 'application/json');
      } else if (action === 'remove-current' && current) {
        if (confirm(`Remove “${current.name}” from this device? Export it first if you need a copy.`)) {
        await takeStorage.deleteTake(current.id); takes = await takeStorage.listTakes(); current = takes[0] ?? null; message = 'Take removed from this device.'; render();
        }
      } else if (action === 'update') location.reload();
    } catch (error) {
      messageType = 'error';
      message = error instanceof Error ? error.message : 'Something went wrong. Try again.';
      render();
    }
  }));
  document.querySelector<HTMLInputElement>('#file-input')?.addEventListener('change', async (event) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    try { await handleFile(file); } catch (error) { messageType = 'error'; message = error instanceof Error ? error.message : 'Could not import that file.'; render(); }
  });
  document.querySelector<HTMLSelectElement>('[data-field="device"]')?.addEventListener('change', (event) => { selectedDevice = (event.currentTarget as HTMLSelectElement).value; });
  const tempoFields = ['bpm-start', 'bpm-end', 'bpm-step'] as TempoField[];
  for (const field of tempoFields) {
    const input = document.querySelector<HTMLInputElement>(`[data-field="${field}"]`);
    input?.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const next = tempoFields[tempoFields.indexOf(field) + (event.shiftKey ? -1 : 1)];
      pendingTempoTabFocus = next ? `[data-field="${next}"]` : undefined;
    });
    input?.addEventListener('change', (event) => {
    const update = updateTempo({ start: bpmStart, end: bpmEnd, step: bpmStep, current: currentBpm }, field, (event.currentTarget as HTMLInputElement).value);
    bpmStart = update.state.start;
    bpmEnd = update.state.end;
    bpmStep = update.state.step;
    currentBpm = update.state.current;
    if (update.announcement) { messageType = 'status'; message = update.announcement; }
    const nextFocus = pendingTempoTabFocus;
    pendingTempoTabFocus = undefined;
    render(nextFocus, Boolean(nextFocus));
    });
  }
  document.querySelectorAll<HTMLButtonElement>('[data-open]').forEach((button) => button.addEventListener('click', () => { current = takes.find((take) => take.id === button.dataset.open) ?? current; if (current) currentBpm = current.bpm; render(); location.hash = 'workspace'; }));
  document.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((button) => button.addEventListener('click', async () => {
    const take = takes.find((item) => item.id === button.dataset.delete);
    if (take && confirm(`Delete “${take.name}” from this device?`)) { await takeStorage.deleteTake(take.id); takes = await takeStorage.listTakes(); if (current?.id === take.id) current = takes[0] ?? null; render(); }
  }));
}

window.addEventListener('online', () => { offline = false; message = 'Back online.'; render(); });
window.addEventListener('offline', () => { offline = true; render(); });
window.addEventListener('keydown', (event) => {
  if ((event.target as HTMLElement).matches('input, select, textarea, button, a')) return;
  if (event.code === 'Space' && current) { event.preventDefault(); document.querySelector<HTMLButtonElement>('[data-action="play"]')?.click(); }
});

async function init(): Promise<void> {
  render();
  try {
    takes = await takeStorage.listTakes();
    current = takes[0] ?? null;
    if (demoMode && !current) await loadTake(sampleTake(), 'Demo loaded. The sample stays separate from your real takes.');
    else render();
  } catch { messageType = 'error'; message = 'Local storage is unavailable. You can still work, but this take may not survive a refresh.'; render(); }
  if ('serviceWorker' in navigator) {
    try {
      const hadController = Boolean(navigator.serviceWorker.controller);
      const registration = await navigator.serviceWorker.register('/sw.js');
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && hadController) document.querySelector<HTMLElement>('#update-toast')!.hidden = false;
        });
      });
    } catch { /* the app remains usable without installation support */ }
  }
  try {
    await fetch(`/online-check?${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
  } catch {
    offline = true;
    render();
  }
}

void init();
