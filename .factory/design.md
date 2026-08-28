# Rhythm Pedal Tidy — visual thesis

## Direction: cassette-era rehearsal zine

The product should feel like the useful page torn from a musician's practice
notebook: tactile, direct, a little imperfect, and trustworthy enough to put
between an instrument and a DAW. Cassette labels and photocopied rehearsal
flyers provide the visual grammar, while the piano-roll remains precise. The
texture explains the product's world; it never competes with note timing.

This is intentionally a single warm-paper treatment. A forced dark theme
would weaken the photocopy metaphor, so the page paints its background in all
color-scheme settings.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#f3eddd` | page background |
| Tape | `#fffaf0` | raised working surfaces |
| Ink | `#171813` | body and control text |
| Faded ink | `#57584f` | secondary copy (7:1 on paper) |
| Signal red | `#c9342f` | primary action and changed notes |
| Deep red | `#8f211e` | hover/active and accessible small text |
| Oxide teal | `#08766f` | repaired/ready state |
| Mustard | `#e2ad38` | caution and current playhead |
| Pencil | `#b8ae96` | rules and inactive rails |
| Danger | `#9d2020` | errors, paired with words/icons |

All text/background combinations are designed for WCAG AA. Color is always
paired with a label, hatch pattern, or shape.

## Type and rhythm

- Display: `Arial Black`, `Helvetica Neue`, system sans; condensed with tight
  tracking to evoke hand-set flyer headlines without a font download.
- Working text: `Courier New`, `Courier`, monospace. It makes event counts,
  timestamps, and MIDI channels align like a tape counter.
- Scale: 14, 16, 20, 28, and clamp(40–72) px. Body copy is at least 16 px.
- Spacing follows an 8 px base with 4 px micro-adjustments: 8, 12, 16, 24,
  32, 48, 64. Text measures top out around 68 characters.

## Composition and interaction grammar

- The landing workspace is a two-part tape deck: an editorial intro beside a
  recorder transport, followed by one continuous workbench rather than a
  dashboard of generic cards.
- Thick ink rules, offset shadows, punched circles, registration marks, and
  taped labels make hierarchy obvious. Corners are mostly square.
- Primary actions are red blocks; transport buttons are mechanical controls;
  selected modes appear pressed down by losing their offset shadow.
- Keyboard focus uses a paired tape-and-ink ring: tape is legible on the dark
  deck and ink is legible on paper, tape, and red controls. It replaces a
  single decorative accent so every keyboard stop is visually accountable.
- The diff view uses solid teal for the repaired duration and red hatching for
  the removed overlap. The before/after meaning is also written in its legend
  and accessible summary.
- On phones the illustration and optional explanatory copy yield first; the
  transport, take summary, and cleanup controls stack in the practice order.

## Motion

UI responses use 160–220 ms transform/opacity transitions. Record status
pulses slowly and the playhead travels linearly because both movements explain
live state. Nothing decorative loops. Under `prefers-reduced-motion`, pulses
become a static ring, the playhead updates without transitions, and entrances
become instant opacity changes.

## Asset plan and provenance

Hero asset: an original wide editorial still life of a sustain pedal, MIDI
cable, cassette, and clipped piano-roll strip in a two-ink risograph / halftone
print. It clarifies the bridge between physical practice and clean MIDI.

Prompt sheet:

> Use case: stylized-concept. Asset type: wide landing-page editorial
> illustration. Subject: a metal piano sustain pedal connected by a curling
> MIDI cable to a translucent cassette tape, with a narrow punched piano-roll
> paper strip showing tidy block notes. World: 1980s rehearsal-room zine still
> life on warm fibrous paper. Style: hand-cut collage, two-colour risograph,
> coarse halftone dots, imperfect ink registration, screen-printed shadows,
> no photorealism. Composition: landscape, objects grouped to the right with
> calm negative paper space at upper left; clean silhouette at small sizes.
> Light: hard desk-lamp shadow. Palette words: bone paper, carbon black,
> signal red, oxidized teal, tiny mustard accent. Avoid: people, hands, feet,
> brands, logos, UI screenshots, gradients, glossy 3D, legible text, musical
> notation, extra pedals, watermarks. No text, no watermark, no logos.

Generated with the factory Azure image deployment via
`/opt/fleet/lib/gen-image.sh` on 2026-08-27. The selected source and prompt
sidecar live under `assets/src/`; the shipping WebP is locally optimized and
is original project artwork. Icons and piano-roll graphics are hand-authored
SVG/CSS and MIT-licensed with the repository.
