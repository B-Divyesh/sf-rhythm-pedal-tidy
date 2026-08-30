# Rhythm Pedal Tidy demo

## Entry point

Open `/demo` or select **Try it with sample data** on the landing page. The
same route works when installed and after the service worker has cached the
first visit.

## Sample

The demo seeds **Warm-up in C**: eight notes at 120 BPM, two CC64 pedal
presses, and three repeated-pitch overlaps. It opens directly on the repaired
workbench, where the before/after roll, timing score, replay, accept action,
and MIDI/session exports are available.

## Isolation and reset

Real takes use IndexedDB database `rhythm-pedal-tidy`. Demo takes use only
`demo:rhythm-pedal-tidy`; the demo does not read or write the real database.
The persistent demo banner provides **Reset demo**, which replaces only demo
data with a fresh sample, and **Start for real**, which clears the demo
database before returning to `/`.

The demo supports importing files and changing the sample while it is open,
but that work remains in the demo database and is discarded by Start for real.
