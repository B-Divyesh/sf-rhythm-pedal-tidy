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
const BUILD_ID = 'v1.0.3';

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
    if (demoMode) {
      return `<section class="demo-loading" aria-busy="true"><h1 id="page-title" tabindex="-1">Loading the sample take.</h1><p>The isolated demo is getting ready.</p></section>`;
    }
    return `<section class="empty-state" aria-labelledby="empty-title">
      <span class="tape-number">No take loaded</span>
      <h2 id="empty-title">Bring in a pedal take</h2>
      <p>Import a Standard MIDI type 0 or 1 file. We’ll find notes held open by the sustain pedal and show each suggested cut.</p>
      <div class="action-row">
        <button class="primary" data-action="import">Import MIDI or take file</button>
        <a class="secondary button-link" href="/?demo=1">Try it with sample data</a>
      </div>
      <p class="fineprint">Use .mid import when live Web MIDI is not available in your browser.</p>
    </section>`;
  }
  const result = tidyTake(current);
  const cleaned = current.cleanedNotes ?? result.notes;
  const score = scoreTiming(cleaned, current.bpm);
  const accepted = current.accepted === true;
  const takeHeading = demoMode ? 'h1' : 'h2';
  const sectionHeading = demoMode ? 'h2' : 'h3';
  const takeHeadingId = demoMode ? 'page-title' : 'take-title';
  return `<section class="workbench" aria-labelledby="${takeHeadingId}">
    <div class="take-heading">
      <div><span class="tape-number">${demoMode ? 'Sample take' : `${escapeHtml(current.source.toUpperCase())} / ${new Date(current.createdAt).toLocaleDateString()}`}</span><${takeHeading} id="${takeHeadingId}" tabindex="-1">${escapeHtml(current.name)}</${takeHeading}></div>
      <button class="text-button danger-text" data-action="remove-current">Remove take</button>
    </div>
    <div class="stats-strip" aria-label="Take summary">
      <div><strong>${current.notes.length}</strong><span>notes</span></div>
      <div><strong>${current.pedals.filter((p) => p.down).length}</strong><span>pedal presses</span></div>
      <div><strong>${result.changedCount}</strong><span>overlaps found</span></div>
      <div><strong>${(result.overlapRemovedMs / 1000).toFixed(2)}s</strong><span>overlap removed</span></div>
    </div>
    <div class="diff-heading">
      <div><span class="eyebrow">Pedal-aware repair</span><${sectionHeading}>${result.changedCount ? `${result.changedCount} clean cut${result.changedCount === 1 ? '' : 's'} suggested` : 'Already tidy'}</${sectionHeading}></div>
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
        <div class="score-lockup"><strong>${score.score}</strong><div><${sectionHeading} id="score-title">Timing score</${sectionHeading}><span>Mean offset ${score.meanErrorMs.toFixed(0)} ms</span></div></div>
        <div class="score-breakdown"><span>On grid <b>${score.onGrid}</b></span><span>Early <b>${score.early}</b></span><span>Late <b>${score.late}</b></span></div>
        <p>Score measures note starts against the nearest sixteenth-note pulse. It is feedback, not a judgment of feel.</p>
      </section>
      <section class="ramp-panel" aria-labelledby="ramp-title">
        <span class="eyebrow">Practice replay</span>
        <${sectionHeading} id="ramp-title">Tempo ramp</${sectionHeading}>
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
        <p id="tempo-guidance">Start is 30–240 BPM, Finish is ${bpmStart}–300 BPM, and Step is 1–30 BPM. Each completed replay adds ${bpmStep} BPM, up to ${bpmEnd}.</p>
      </section>
    </div>
    <div class="export-bar">
      <div><strong>Export the cleaned take</strong><span>Pedal sustain is baked into clean note lengths.</span></div>
      <button class="primary" data-action="export-midi">Export cleaned MIDI</button>
      <button class="secondary" data-action="export-json">Export take</button>
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

function updateRouteMetadata(): void {
  const title = demoMode ? 'Demo — Rhythm Pedal Tidy' : 'Rhythm Pedal Tidy — clean sustain-pedal MIDI';
  const description = demoMode
    ? 'Try sustain-pedal MIDI cleanup with an isolated eight-note practice take.'
    : 'Clean sustain-pedal MIDI overlaps, compare each repair, replay the take, and export locally.';
  const canonical = `https://rhythm-pedal-tidy.sociobot.in${demoMode ? '/demo' : '/'}`;
  document.title = title;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', canonical);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', description);
}

function render(preferredFocus?: string, deferFocus = false): void {
  const focus = preferredFocus ?? focusSelector(document.activeElement);
  updateRouteMetadata();
  document.body.classList.toggle('demo-route', demoMode);
  const hero = `<section class="hero" aria-labelledby="page-title">
      <div class="hero-copy"><span class="kicker">MIDI cleanup for practice takes</span><h1 id="page-title" tabindex="-1">Clean sustain-pedal<br><em>MIDI overlaps.</em></h1><p>For keyboard and e-kit players who need clean practice takes without changing note starts.</p><a class="primary button-link" href="/?demo=1">Try it with sample data</a><span class="action-explainer">Loads an 8-note practice take right away.</span><ul class="hero-facts"><li>Your MIDI stays on this device.</li><li>Works offline after the first visit.</li><li>Export cleaned MIDI free.</li></ul></div>
      <picture class="hero-art"><source type="image/webp" media="(max-width: 700px)" srcset="/assets/pedal-tape-hero-720.webp"><source type="image/avif" srcset="/assets/pedal-tape-hero.avif"><source type="image/webp" srcset="/assets/pedal-tape-hero.webp"><img src="/assets/pedal-tape-hero.jpg" width="1200" height="800" alt="Risograph collage of a sustain pedal connected to a cassette and tidy piano-roll strip" decoding="async" fetchpriority="high"></picture>
      <div class="hero-note" aria-label="How it works"><b>01</b> capture <span>→</span> <b>02</b> inspect <span>→</span> <b>03</b> export</div>
    </section>`;
  const inputDeck = `<section class="input-deck" id="workspace" aria-labelledby="input-title">
      <div class="section-label"><span>INPUT / 01</span><h2 id="input-title">Load the take</h2></div>
      <div class="input-controls">
        <button class="primary" data-action="import">↑ Import MIDI or take file</button>
        <div class="live-midi">
          <button class="secondary" data-action="connect">${devices.length ? 'Refresh MIDI inputs' : 'Connect live MIDI'}</button>
          ${devices.length ? `<label>Input <select data-field="device"><option value="">Choose an input</option>${devices.map((device) => `<option value="${device.id}" ${device.id === selectedDevice ? 'selected' : ''}>${escapeHtml(device.name)}</option>`).join('')}</select></label><button class="record-button ${recorder.recording ? 'recording' : ''}" data-action="record">${recorder.recording ? '■ Stop take' : '● Record take'}</button>` : ''}
        </div>
      </div>
      <input class="visually-hidden" id="file-input" tabindex="-1" aria-label="Choose a MIDI or take file" type="file" accept=".mid,.midi,.json,audio/midi,application/json" />
    </section>`;
  app.innerHTML = `<header class="site-header">
    <a class="brand" href="/" aria-label="Rhythm Pedal Tidy home"><span class="brand-mark" aria-hidden="true">RPT</span><span>Rhythm Pedal Tidy</span></a>
    <nav aria-label="Main navigation"><a href="/demo">Demo</a><a href="#workspace">Workspace</a><a href="#takes">Takes</a><a href="/privacy/">Privacy</a></nav>
    <span class="privacy-stamp">LOCAL ONLY</span>
  </header>
  ${demoMode ? `<section class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved to your real takes.</strong><div><button class="secondary compact" data-action="reset-demo">Reset demo</button><button class="text-button demo-exit" data-action="start-real">Start for real</button></div></section>` : ''}
  ${offline ? '<div class="offline-banner" role="status">Offline: saved takes, cleanup, replay, and exports remain available.</div>' : ''}
  <main id="main" class="${demoMode ? 'demo-main' : ''}">
    ${demoMode ? '' : hero}
    ${demoMode ? '' : inputDeck}
    <div id="announcer" class="status-line ${messageType}" role="status" aria-live="polite">${escapeHtml(message)}</div>
    ${renderWorkspace()}
    ${demoMode ? inputDeck : ''}
    <section class="history-section" id="takes" aria-labelledby="takes-title">
      <div class="section-label"><span>SAVED / 02</span><h2 id="takes-title">Saved takes</h2></div>
      <div class="history-layout"><div>${renderHistory()}</div><div class="data-tools"><p>Back up every locally saved take in one portable JSON file.</p><div class="action-row"><button class="secondary" data-action="backup">Export all data</button><button class="text-button" data-action="import">Import backup</button></div></div></div>
    </section>
    <section class="unlock-section" id="use-notes" aria-labelledby="use-notes-title">
      <div class="price-sticker"><span>FULL TOOL</span><strong>FREE</strong><small>No checkout</small></div>
      <div><span class="eyebrow">Use on your device</span><h2 id="use-notes-title">Bring in your own MIDI.</h2><p>Import a type 0 or 1 MIDI file, or connect a compatible MIDI input. Review the repair before export.</p><ul><li>Local MIDI import and export</li><li>Live Web MIDI when your browser supports it</li><li>Saved take history on this device</li></ul><p class="fineprint">No account, payment, analytics, or performance-data upload is used in this build.</p></div>
      <div class="buy-panel"><strong class="unlocked">No checkout in this build</strong><p>All available controls are ready to use. Read the privacy page to see what stays on your device.</p><a class="secondary button-link" href="/privacy/">Read privacy</a></div>
    </section>
  </main>
  <footer><div><strong>Rhythm Pedal Tidy</strong><span>Clean sustain-pedal overlaps on this device.</span></div><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-rhythm-pedal-tidy">Source</a></nav><p>Built by Param Factory · ${BUILD_ID}</p></footer>
  <div id="route-announcer" class="visually-hidden" role="status" aria-live="polite"></div>
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

async function loadTake(take: Take, announcement: string, isRouteEntry = false): Promise<void> {
  if (!take.notes.length) throw new Error('No note events were found in that take.');
  const result = tidyTake(take);
  current = { ...take, cleanedNotes: result.notes };
  ({ start: bpmStart, end: bpmEnd, step: bpmStep, current: currentBpm } = tempoStateFromTakeBpm(current.bpm));
  await persist(current);
  messageType = 'status';
  message = announcement;
  const headingSelector = demoMode ? '#page-title' : '#take-title';
  render(isRouteEntry ? '#page-title' : headingSelector, isRouteEntry);
  if (!isRouteEntry) document.querySelector(headingSelector)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function handleFile(file: File): Promise<void> {
  if (file.size > 20 * 1024 * 1024) throw new Error('That file is over 20 MB. Split the take and try again.');
  if (file.name.toLowerCase().endsWith('.json')) {
    let parsed: unknown;
    try { parsed = JSON.parse(await file.text()); } catch { throw new Error('That JSON file could not be read. Choose an exported take or backup.'); }
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
    const importedTake = validateImportedTake(parsed);
    await loadTake({ ...importedTake, id: crypto.randomUUID(), source: 'json', createdAt: new Date().toISOString() }, 'Take imported and cleaned.');
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
          message = 'Recording. Play now; sustain-pedal messages are being captured.';
          render();
        }
      } else if (action === 'accept' && current) {
        current.accepted = true;
        await persist(current);
        message = 'Cleanup accepted and saved with this take.';
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
    if (demoMode && !current) await loadTake(sampleTake(), '', true);
    else render('#page-title', true);
  } catch { messageType = 'error'; message = 'Local storage is unavailable. You can still work, but this take may not survive a refresh.'; render('#page-title', true); }
  announceRouteAndFocus();
  if ('serviceWorker' in navigator) {
    try {
      const hadController = Boolean(navigator.serviceWorker.controller);
      const registration = await navigator.serviceWorker.register('/sw.js');
      const offerUpdate = () => {
        if (hadController) document.querySelector<HTMLElement>('#update-toast')?.removeAttribute('hidden');
      };
      navigator.serviceWorker.addEventListener('controllerchange', offerUpdate, { once: true });
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') offerUpdate();
        });
      });
    } catch { /* the app remains usable without installation support */ }
  }
  try {
    await fetch(`/robots.txt?online=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
  } catch {
    offline = true;
    render();
  }
}

function announceRouteAndFocus(): void {
  document.querySelector<HTMLElement>('#page-title')?.focus({ preventScroll: true });
  requestAnimationFrame(() => {
    const announcer = document.querySelector<HTMLElement>('#route-announcer');
    if (announcer) announcer.textContent = demoMode ? 'Demo route loaded.' : 'Rhythm Pedal Tidy workspace loaded.';
  });
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) announceRouteAndFocus();
});

void init();
