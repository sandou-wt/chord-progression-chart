/**
 * Original example phrases written for this site (not taken from any song).
 * Notation per bar: "degree:beats" tokens, one bar per chord, 4 beats per bar.
 * Degrees are relative to the major scale of the key's tonic: 1 2 3 4 5 6 7,
 * with b/# for alterations (b3, b6, b7, b5). "," = octave down, "'" = octave up.
 * "-" is a rest. If the progression does not end on the tonic chord, one extra
 * bar on the tonic chord is added for the final note (see phraseNumerals).
 */

const MAJOR_DEG = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 };

/** Semitones above the tonic for a degree token like "b3", "5,", "2'". */
export function degreeToSemitones(token) {
  const m = String(token).match(/^([b#]*)([1-7])([,']*)$/);
  if (!m) throw new Error(`Bad degree: ${token}`);
  let semi = MAJOR_DEG[m[2]];
  for (const ch of m[1]) semi += ch === "b" ? -1 : 1;
  for (const ch of m[3]) semi += ch === "'" ? 12 : -12;
  return semi;
}

/** Parse bar strings into notes { semi, beat, dur } (rests omitted). */
export function parseMelody(bars) {
  const notes = [];
  bars.forEach((bar, bi) => {
    let pos = 0;
    for (const tok of bar.trim().split(/\s+/)) {
      const [deg, durStr] = tok.split(":");
      const dur = Number(durStr);
      if (!(dur > 0)) throw new Error(`Bad duration in "${tok}"`);
      if (deg !== "-") notes.push({ semi: degreeToSemitones(deg), beat: bi * 4 + pos, dur, bar: bi, pos });
      pos += dur;
    }
  });
  return notes;
}

export function barLengths(bars) {
  return bars.map((bar) =>
    bar
      .trim()
      .split(/\s+/)
      .reduce((s, tok) => s + Number(tok.split(":")[1]), 0)
  );
}

/** Tonic pitch for melodies: keeps phrases in a singable middle register (G3–F♯4). */
export function melodyTonicMidi(tonicPc) {
  return 55 + ((tonicPc - 7 + 12) % 12);
}

/** Chord numerals the phrase is played over (adds a final tonic bar if needed). */
export function phraseNumerals(numerals, mode) {
  const last = numerals[numerals.length - 1];
  const tonic = /^(I|i)(maj7|7)?$/.test(last);
  if (tonic) return [...numerals];
  const isBlues = numerals.every((n) => /7$/.test(n));
  const home = mode === "minor" ? (isBlues ? "i7" : "i") : isBlues ? "I7" : "I";
  return [...numerals, home];
}

export const PHRASE_LABEL = "Original phrases written for this site — not taken from any song.";

export const MELODIES = {
  "pop-axis": [
    {
      id: "hook",
      title: "Singable hook",
      why: "Lands on a chord tone on every downbeat (3 over I, 2 over V, 3 over vi, 1 over IV), and bar 3 repeats bar 1 so the ear hears call and response.",
      bars: ["3:1 3:0.5 2:0.5 1:1 2:1", "2:1.5 1:0.5 7,:1 5,:1", "3:1 3:0.5 2:0.5 1:1 6,:1", "1:1.5 6,:0.5 4:1 2:1", "1:4"],
    },
    {
      id: "rise",
      title: "Rising answer",
      why: "Climbs through the top of each chord (5, 7, 6, then 1′) and lets the leading tone 7 step up to the high tonic.",
      bars: ["5:1.5 6:0.5 5:1 3:1", "7:1 2':1 7:1 5:1", "6:1.5 1':0.5 6:1 3:1", "4:1 6:1 1':1 7:1", "1':4"],
    },
  ],
  classic: [
    {
      id: "arpeggio",
      title: "Arpeggio climb",
      why: "Outlines each chord in turn (1–3–5, 4–6–1, 7–5–2) and lets the leading tone resolve up to the tonic.",
      bars: ["1:1 3:1 5:1.5 3:0.5", "4:1 6:1 1':1.5 6:0.5", "7,:1 2:1 5:1 7,:1", "1:4"],
    },
    {
      id: "call",
      title: "Call and response",
      why: "The same rhythm on each chord, shifted to that chord’s notes, then a stepwise walk down 5–4–3–2 into the tonic.",
      bars: ["5:0.5 5:0.5 6:0.5 5:0.5 3:2", "6:0.5 6:0.5 1':0.5 6:0.5 4:2", "5:1 4:0.5 3:0.5 2:2", "1:4"],
    },
  ],
  "doo-wop": [
    {
      id: "sway",
      title: "Doo-wop sway",
      why: "Bars 1 and 2 use the same falling shape over I and vi; bar 4 walks down V’s chord tones to the leading tone, which resolves to 1.",
      bars: ["5:2 3:1 1:1", "6:2 3:1 1:1", "4:1 6:1 1':1 6:1", "7:1 5:1 2:1 7,:1", "1:4"],
    },
    {
      id: "pickup",
      title: "Pick-up phrase",
      why: "Each bar starts with a short 1–2 pickup into a chord tone, and the top line rises to 2′ over V before settling on the high tonic.",
      bars: ["1:0.5 2:0.5 3:1 5:1 3:1", "1:0.5 2:0.5 3:1 6:1 3:1", "4:0.5 3:0.5 4:1 6:1 1':1", "2':1.5 1':0.5 7:1 5:1", "1':4"],
    },
  ],
  "axis-rotation": [
    {
      id: "sequence",
      title: "Falling sequence",
      why: "The same arpeggio shape moves from vi to IV, then repeats on I and V, so the phrase sounds planned and easy to remember.",
      bars: ["3:1 1:1 6,:1 1:1", "4:1 1:1 6,:1 1:1", "5:1 3:1 1:1 3:1", "2:1 7,:1 5,:1 7,:1", "1:4"],
    },
    {
      id: "sigh",
      title: "Long-short sigh",
      why: "A dotted rhythm on chord tones (6 over vi, 6 over IV, 5 over I), then 2–5–7–2′ over V leans into the high tonic.",
      bars: ["6:1.5 5:0.5 3:2", "6:1.5 5:0.5 4:2", "5:1.5 3:0.5 1:1 3:1", "2:1 5:1 7:1 2':1", "1':4"],
    },
  ],
  "pop-variant": [
    {
      id: "leap",
      title: "Open leap",
      why: "Leaps up to the high tonic over I, answers with a lower line over IV, and uses 7 over V to lead home.",
      bars: ["3:1 5:1 1':2", "6:1 4:1 1:2", "3:1 6:1 1':1.5 7:0.5", "7:1 2':1 5:1 7:1", "1':4"],
    },
    {
      id: "steps",
      title: "Stepping pattern",
      why: "One rhythm repeated on every chord: a short pickup, two notes on the chord, then a step down. Ends 2–5–7,–2 into 1.",
      bars: ["1:0.5 3:0.5 5:1 5:1 3:1", "1:0.5 4:0.5 6:1 6:1 4:1", "1:0.5 3:0.5 6:1 6:1 3:1", "2:1 5:1 7,:1 2:1", "1:4"],
    },
  ],
  "jazz-251": [
    {
      id: "guide",
      title: "Guide-tone line",
      why: "Starts on the 7th of ii7 and the 3rd of V7: the notes that resolve by half step in the cadence. Ends on the tonic.",
      bars: ["1':1 6:0.5 4:0.5 2:1 4:1", "7:1 5:0.5 4:0.5 2:1 4:1", "3:1 1:3"],
    },
    {
      id: "bebop",
      title: "Eighth-note run",
      why: "Runs up the Dm7 arpeggio to 2′, then down the G7 arpeggio, a common jazz shape, before landing on 1.",
      bars: ["2:0.5 4:0.5 6:0.5 1':0.5 2':1 1':1", "7:0.5 5:0.5 4:0.5 2:0.5 7,:1 2:1", "1:4"],
    },
  ],
  "circle-short": [
    {
      id: "sequence",
      title: "Stepping-down sequence",
      why: "The same four-note figure starts a step lower on each chord (1′ over vi, 6 over ii), following the falling fifths.",
      bars: ["1':1 7:0.5 6:0.5 3:2", "6:1 5:0.5 4:0.5 2:2", "5:1 4:0.5 3:0.5 2:1 7,:1", "1:4"],
    },
    {
      id: "arch",
      title: "Arch phrase",
      why: "Each bar climbs to the chord’s highest note and falls back; the 4 over V resolves to 3 over I, then to the tonic.",
      bars: ["3:0.5 6:0.5 1':1 6:1 3:1", "4:0.5 6:0.5 2':1 6:1 4:1", "2':1 7:1 5:1 4:1", "3:2 1:2"],
    },
  ],
  "circle-full": [
    {
      id: "sequence",
      title: "Arpeggio sequence",
      why: "One arpeggio shape repeated down the circle; the top note falls by step every two bars (1′, 7, 6, 5), a classic circle-of-fifths line.",
      bars: [
        "1':1.5 5:0.5 3:1 5:1",
        "1':1.5 6:0.5 4:1 6:1",
        "7:1.5 4:0.5 2:1 4:1",
        "7:1.5 5:0.5 3:1 5:1",
        "6:1.5 3:0.5 1:1 3:1",
        "6:1.5 4:0.5 2:1 4:1",
        "5:1.5 2:0.5 7,:1 2:1",
        "1:4",
      ],
    },
    {
      id: "pairs",
      title: "Paired motifs",
      why: "A short three-note motif and its answer, moved down the scale with the chords; every downbeat is a chord tone.",
      bars: [
        "3:0.5 4:0.5 5:1 5:2",
        "4:0.5 3:0.5 4:1 6:2",
        "2:0.5 3:0.5 4:1 4:2",
        "3:0.5 2:0.5 3:1 5:2",
        "1:0.5 2:0.5 3:1 3:2",
        "2:0.5 1:0.5 2:1 4:2",
        "7,:0.5 1:0.5 2:1 5,:1 7,:1",
        "1:4",
      ],
    },
  ],
  "minor-145": [
    {
      id: "modal",
      title: "Modal line",
      why: "Stays in natural minor: chord tones on each downbeat (5, b6, b7), with b7 over v giving the soft, folky pull home.",
      bars: ["5:1 b3:0.5 4:0.5 5:2", "b6:1 4:0.5 5:0.5 b6:1 1':1", "b7:1 5:0.5 4:0.5 2:2", "1:4"],
    },
    {
      id: "arpeggio",
      title: "Minor arpeggios",
      why: "Climbs each chord from its lowest note (1–b3–5, 1–4–b6, 2–4–5–b7) so you can hear the three chords one after another.",
      bars: ["1:0.5 b3:0.5 5:1 b3:1 1:1", "1:0.5 4:0.5 b6:1 4:1 1:1", "2:0.5 4:0.5 5:1 b7:1.5 5:0.5", "1:4"],
    },
  ],
  "harmonic-cadence": [
    {
      id: "sequence",
      title: "Sequence to the leading tone",
      why: "The same rhythm moves down with the chords; over V the leading tone 7 appears and rises to the tonic.",
      bars: ["b3:1.5 2:0.5 1:1 5,:1", "4:1.5 b3:0.5 1:1 b6,:1", "7,:1.5 1:0.5 2:1 7,:1", "1:4"],
    },
    {
      id: "lament",
      title: "Lament",
      why: "A sighing b6–5 over i, then 2 and the leading tone over V: the raised 7th gives the ending its classical pull.",
      bars: ["5:1 b6:0.5 5:0.5 b3:2", "4:1 5:0.5 4:0.5 1:2", "2:1 b3:0.5 2:0.5 7,:2", "1:4"],
    },
  ],
  "epic-minor": [
    {
      id: "anthem",
      title: "Anthem line",
      why: "Starts high on the tonic and falls to chord tones (5 over i, b6 over VI, 5 over III), then b7 leads back to 1.",
      bars: ["1':1 b7:0.5 5:0.5 5:2", "1':1 b7:0.5 b6:0.5 b6:2", "b7:1 5:0.5 b3:0.5 5:2", "2:1 4:0.5 2:0.5 b7,:2", "1:4"],
    },
    {
      id: "chant",
      title: "Repeated chant",
      why: "The same rhythm on every chord (two short notes, a quarter, a half), so the chords do the work of changing the colour.",
      bars: ["5:0.5 5:0.5 b3:1 1:2", "b6:0.5 b6:0.5 b3:1 1:2", "5:0.5 5:0.5 b7:1 5:2", "4:0.5 4:0.5 2:1 b7,:1 2:1", "1:4"],
    },
  ],
  andalusian: [
    {
      id: "descent",
      title: "Descending lament",
      why: "Follows the falling bass from above (1′, b7, b6, 5) and ends with b6–5 and the leading tone over the major V.",
      bars: ["1':1 b7:0.5 1':0.5 5:2", "b7:1 b6:0.5 b7:0.5 4:2", "b6:1 5:0.5 b6:0.5 b3:2", "5:1 b6:0.5 5:0.5 7,:2", "1:4"],
    },
    {
      id: "turn",
      title: "Turning figure",
      why: "A small turn around a chord tone, repeated a step lower on each chord, mirroring the bass line.",
      bars: ["b3:0.5 2:0.5 1:0.5 2:0.5 b3:2", "2:0.5 1:0.5 b7,:0.5 1:0.5 2:2", "1:0.5 b7,:0.5 b6,:0.5 b7,:0.5 1:2", "7,:0.5 b6,:0.5 5,:0.5 b6,:0.5 7,:2", "1:4"],
    },
  ],
  "aeolian-rock": [
    {
      id: "riff",
      title: "Rock riff",
      why: "Syncopated minor-pentatonic figure on each chord, pushing into the next beat like a guitar riff.",
      bars: ["1:0.5 1:0.5 b3:0.5 5:1 b3:0.5 1:1", "1:0.5 1:0.5 b3:0.5 b6:1 b3:0.5 1:1", "2:0.5 2:0.5 4:0.5 b7:1 4:0.5 2:1", "1:4"],
    },
    {
      id: "arpeggio",
      title: "Falling arpeggios",
      why: "Each chord broken from the top down; b7 over VII steps up to the tonic for the arrival.",
      bars: ["5:1 b3:1 1:1 b3:1", "b6:1 b3:1 1:1 b3:1", "b7:1 4:1 2:1 b7,:1", "1:4"],
    },
  ],
  "minor-circle": [
    {
      id: "sequence",
      title: "Arpeggio sequence",
      why: "One arpeggio shape on every chord; the top note falls by step every two bars, and the leading tone appears over V.",
      bars: [
        "1':1.5 5:0.5 b3:1 5:1",
        "1':1.5 b6:0.5 4:1 b6:1",
        "b7:1.5 4:0.5 2:1 4:1",
        "b7:1.5 5:0.5 b3:1 5:1",
        "b6:1.5 b3:0.5 1:1 b3:1",
        "b6:1.5 4:0.5 2:1 4:1",
        "5:1.5 2:0.5 7,:1 2:1",
        "1:4",
      ],
    },
    {
      id: "pairs",
      title: "Paired motifs",
      why: "A three-note motif and its answer, moved down the scale with the chords; the leading tone over V points home.",
      bars: [
        "b3:0.5 4:0.5 5:1 5:2",
        "4:0.5 b3:0.5 4:1 b6:2",
        "2:0.5 b3:0.5 4:1 4:2",
        "b3:0.5 2:0.5 b3:1 5:2",
        "1:0.5 2:0.5 b3:1 b3:2",
        "2:0.5 1:0.5 2:1 4:2",
        "7,:0.5 1:0.5 2:1 5,:1 7,:1",
        "1:4",
      ],
    },
  ],
};

/** Blues phrases, swung eighths. Keyed by blues form id. */
const BLUES_LINE = {
  id: "line",
  title: "Call-and-answer blues line",
  why: "AAB form: the bar-1 idea is repeated over IV7 in bar 5, then answered over V7. Uses the blues scale (b3, b7) against the dominant chords.",
  bars: [
    "1':0.5 b7:0.5 5:1 b3:0.5 1:0.5 1:1",
    "b3:0.5 1:1.5 -:2",
    "-:1 b3:0.5 3:0.5 5:1 b7:1",
    "1':2 -:2",
    "1':0.5 b7:0.5 5:1 b3:0.5 1:0.5 1:1",
    "4:2 -:2",
    "-:1 b3:0.5 3:0.5 5:1 b3:1",
    "1:2 -:2",
    "2':1 1':0.5 b7:0.5 5:1 4:1",
    "4:1 b3:0.5 1:0.5 1:1 b3:1",
    "1:2 -:2",
    "5:1 4:1 2:1 7,:1",
    "1:4",
  ],
};

const BLUES_RIFF = {
  id: "riff",
  title: "Boogie riff melody",
  why: "A one-bar riff (1–b3–3–5–6) moved to IV7 and V7, the way blues players shift a lick with the chords.",
  bars: [
    "1:0.5 b3:0.5 3:0.5 5:0.5 5:0.5 6:0.5 5:0.5 b3:0.5",
    "1:2 -:2",
    "1:0.5 b3:0.5 3:0.5 5:0.5 5:0.5 6:0.5 5:0.5 b3:0.5",
    "1:2 b3:1 3:1",
    "4:0.5 b6:0.5 6:0.5 1':0.5 1':0.5 2':0.5 1':0.5 b6:0.5",
    "4:2 -:2",
    "1:0.5 b3:0.5 3:0.5 5:0.5 5:0.5 6:0.5 5:0.5 b3:0.5",
    "1:2 -:2",
    "5:0.5 b7:0.5 7:0.5 2':0.5 2':1 b7:0.5 5:0.5",
    "4:0.5 b6:0.5 6:0.5 1':0.5 1':1 b6:0.5 4:0.5",
    "1:0.5 b3:0.5 3:0.5 5:0.5 5:1 b3:0.5 1:0.5",
    "5:1 4:1 2:1 7,:1",
    "1:4",
  ],
};

const BLUES_SPARSE = {
  id: "sparse",
  title: "Slow, sparse phrase",
  why: "Long notes and space, built around 5, b7 and the high tonic; the b3 on strong beats gives the blue colour.",
  bars: [
    "5:1 b7:1 1':2",
    "1':0.5 b7:0.5 1':0.5 b7:0.5 b3:2",
    "1:1 b3:1 5:1 b5:0.5 4:0.5",
    "b3:1 1:3",
    "6:1 b6:0.5 4:0.5 1':2",
    "b3:1.5 4:0.5 1:2",
    "5:1 b7:1 1':2",
    "1':0.5 b7:0.5 1':0.5 b7:0.5 b3:1 1:1",
    "2':2 7:1 5:1",
    "1':2 6:1 4:1",
    "3:1 1:1 b3:1 1:1",
    "2:2 7,:2",
    "1:4",
  ],
};

const MINOR_BLUES_LINE = {
  id: "minor-line",
  title: "Minor blues line",
  why: "Climbs 1–b3–4–b5–5 through the blues scale, repeats the idea over iv7, then uses the leading tone over V7.",
  bars: [
    "1:0.5 b3:0.5 4:0.5 b5:0.5 5:2",
    "b7:1 5:1 b3:2",
    "1:0.5 b3:0.5 4:0.5 b5:0.5 5:1 b7:1",
    "1':2 -:2",
    "4:0.5 b6:0.5 b7:0.5 1':0.5 1':2",
    "b6:1 4:1 1:2",
    "1:0.5 b3:0.5 4:0.5 b5:0.5 5:2",
    "b7:1 5:1 b3:2",
    "7:1.5 2':0.5 7:1 5:1",
    "b6:1.5 4:0.5 1:2",
    "b3:1 1:1 b3:2",
    "7,:2 2:2",
    "1:4",
  ],
};

const MINOR_BLUES_SPARSE = {
  id: "minor-sparse",
  title: "Slow minor phrase",
  why: "Half notes on chord tones only, so each change (i7, iv7, V7) is easy to hear; ends with 2 and 7 over V7 into the tonic.",
  bars: [
    "5:2 b7:1 5:1",
    "b3:2 1:2",
    "5:1 b7:1 1':2",
    "b7:1 5:1 b3:2",
    "1':2 b6:1 4:1",
    "b3:2 1:2",
    "5:2 b7:1 5:1",
    "b3:2 1:2",
    "2':2 7:2",
    "1':2 b6:2",
    "5:2 b3:2",
    "2:2 7,:2",
    "1:4",
  ],
};

export const BLUES_MELODIES = {
  standard: [BLUES_LINE, BLUES_RIFF, BLUES_SPARSE],
  "quick-change": [BLUES_LINE, BLUES_RIFF, BLUES_SPARSE],
  "minor-standard": [MINOR_BLUES_LINE, MINOR_BLUES_SPARSE],
};
