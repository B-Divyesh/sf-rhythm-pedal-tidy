# Rhythm Pedal Tidy demo

## Entry point

Open `/?demo=1` or select **Try it with sample data** on the landing page.
The `/demo` route is a direct alias. Both work after the first cached visit.

## Sample

The demo seeds **Warm-up in C**: eight notes at 120 BPM, two sustain-pedal
presses, and three repeated-pitch overlaps. It opens directly on the repaired
workbench. The before/after roll, timing score, replay, acceptance, and
MIDI/take exports are ready there.

## Isolation and reset

Real takes use IndexedDB database `rhythm-pedal-tidy`. Demo takes use only
`demo:rhythm-pedal-tidy`; the demo does not read or write the real database.
The persistent demo banner provides **Reset demo**, which replaces only demo
data with a fresh sample, and **Start for real**, which clears the demo
database before returning to `/`.

The demo supports importing files and changing the sample while it is open,
but that work remains in the demo database and is discarded by Start for real.
