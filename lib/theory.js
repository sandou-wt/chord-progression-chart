/**
 * Music-theory helpers for the chord progression chart.
 * Spellings follow standard key signatures (e.g. F♯ major vii° is E♯°, not F°).
 */

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export const MAJOR_KEYS = ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"];
export const MINOR_KEYS = ["A", "E", "B", "F♯", "C♯", "G♯", "E♭", "B♭", "F", "C", "G", "D"];

/** Chromatic order with preferred spellings for transposing by semitone. */
export const CHROMATIC_MAJOR = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
export const CHROMATIC_MINOR = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"];

export function parseNote(name) {
  const letter = name[0];
  const accStr = name.slice(1);
  let acc = 0;
  for (const ch of accStr) {
    if (ch === "♯" || ch === "#") acc += 1;
    else if (ch === "♭" || ch === "b") acc -= 1;
    else if (ch === "𝄪") acc += 2;
    else if (ch === "𝄫") acc -= 2;
  }
  if (!LETTER_PC.hasOwnProperty(letter)) {
    throw new Error(`Bad note name: ${name}`);
  }
  return { letter, acc, pc: (LETTER_PC[letter] + acc + 120) % 12 };
}

function formatAccidental(n) {
  if (n === 2) return "♯♯";
  if (n === 1) return "♯";
  if (n === 0) return "";
  if (n === -1) return "♭";
  if (n === -2) return "♭♭";
  if (n > 2) return "♯".repeat(n);
  return "♭".repeat(-n);
}

export function formatNote(letter, acc) {
  return letter + formatAccidental(acc);
}

/**
 * Spell a note a given interval away from `root`, keeping diatonic letter names.
 * letterSpan: 0 = unison, 1 = second, 2 = third, 4 = fifth, 6 = seventh.
 */
export function spellInterval(root, semitones, letterSpan) {
  const { letter, acc } = parseNote(root);
  const rootPc = (LETTER_PC[letter] + acc + 120) % 12;
  const targetLetter = LETTERS[(LETTERS.indexOf(letter) + letterSpan) % 7];
  const naturalPc = LETTER_PC[targetLetter];
  const targetPc = (rootPc + semitones + 120) % 12;
  let targetAcc = targetPc - naturalPc;
  if (targetAcc > 6) targetAcc -= 12;
  if (targetAcc < -6) targetAcc += 12;
  return formatNote(targetLetter, targetAcc);
}

const QUALITY_INTERVALS = {
  major: [
    [0, 0],
    [4, 2],
    [7, 4],
  ],
  minor: [
    [0, 0],
    [3, 2],
    [7, 4],
  ],
  diminished: [
    [0, 0],
    [3, 2],
    [6, 4],
  ],
  augmented: [
    [0, 0],
    [4, 2],
    [8, 4],
  ],
  dominant7: [
    [0, 0],
    [4, 2],
    [7, 4],
    [10, 6],
  ],
  maj7: [
    [0, 0],
    [4, 2],
    [7, 4],
    [11, 6],
  ],
  m7: [
    [0, 0],
    [3, 2],
    [7, 4],
    [10, 6],
  ],
  halfdim7: [
    [0, 0],
    [3, 2],
    [6, 4],
    [10, 6],
  ],
  dim7: [
    [0, 0],
    [3, 2],
    [6, 4],
    [9, 6],
  ],
};

export const QUALITY_SUFFIX = {
  major: "",
  minor: "m",
  diminished: "°",
  augmented: "+",
  dominant7: "7",
  maj7: "maj7",
  m7: "m7",
  halfdim7: "ø7",
  dim7: "°7",
};

export function chordTones(root, quality) {
  const ivals = QUALITY_INTERVALS[quality];
  if (!ivals) throw new Error(`Unknown quality: ${quality}`);
  return ivals.map(([semi, span]) => spellInterval(root, semi, span));
}

export function formatChord(root, quality) {
  return root + QUALITY_SUFFIX[quality];
}

/** Pitch-class of a tonic, used for transposition. */
export function tonicPc(tonic) {
  return parseNote(tonic).pc;
}

export function transposeKey(tonic, mode, semitones) {
  const list = mode === "minor" ? CHROMATIC_MINOR : CHROMATIC_MAJOR;
  const pc = (tonicPc(tonic) + semitones + 120) % 12;
  const name = list.find((n) => parseNote(n).pc === pc);
  return name;
}

/**
 * Scale spellings: major and natural minor, built from the tonic letter + key signature.
 * Harmonic alterations (e.g. raised 7th) are applied later by the numeral quality.
 */
export function scaleNotes(tonic, mode) {
  const steps =
    mode === "minor"
      ? [
          [0, 0],
          [2, 1],
          [3, 2],
          [5, 3],
          [7, 4],
          [8, 5],
          [10, 6],
        ]
      : [
          [0, 0],
          [2, 1],
          [4, 2],
          [5, 3],
          [7, 4],
          [9, 5],
          [11, 6],
        ];
  return steps.map(([semi, span]) => spellInterval(tonic, semi, span));
}

const ROMAN_VALUES = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
};

export function parseNumeral(raw) {
  let s = String(raw).trim();
  let accidental = 0;
  if (s.startsWith("♭") || s.startsWith("b")) {
    accidental = -1;
    s = s.slice(1);
  } else if (s.startsWith("♯") || s.startsWith("#")) {
    accidental = 1;
    s = s.slice(1);
  }

  const match = s.match(/^(VII|VI|IV|III|II|V|I|vii|vi|iv|iii|ii|v|i)/);
  if (!match) throw new Error(`Cannot parse numeral: ${raw}`);
  const roman = match[1];
  const degree = ROMAN_VALUES[roman];
  const isLower = roman === roman.toLowerCase();
  const rest = s.slice(roman.length);

  let quality;
  if (rest.includes("ø")) quality = "halfdim7";
  else if (rest.includes("°7") || rest.includes("dim7")) quality = "dim7";
  else if (rest.includes("°") || rest.includes("dim")) quality = "diminished";
  else if (rest.includes("maj7")) quality = "maj7";
  else if (rest.includes("m7")) quality = "m7";
  else if (rest.includes("7")) quality = isLower ? "m7" : "dominant7";
  else quality = isLower ? "minor" : "major";

  return { degree, accidental, quality, roman, raw };
}

function applyAccidentalToNote(note, accidental) {
  if (!accidental) return note;
  const { letter, acc } = parseNote(note);
  return formatNote(letter, acc + accidental);
}

export function chordFromNumeral(tonic, mode, numeral) {
  const parsed = parseNumeral(numeral);
  const scale = scaleNotes(tonic, mode);
  const root = applyAccidentalToNote(scale[parsed.degree - 1], parsed.accidental);
  return {
    numeral: parsed.raw,
    root,
    quality: parsed.quality,
    name: formatChord(root, parsed.quality),
    tones: chordTones(root, parsed.quality),
  };
}

export function progressionChords(tonic, mode, numerals) {
  return numerals.map((n) => chordFromNumeral(tonic, mode, n));
}

/** Standard 12-bar blues (slow change) and quick-change forms. */
export const BLUES_FORMS = {
  standard: {
    id: "standard",
    name: "Standard 12-bar",
    bars: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "V7"],
  },
  "quick-change": {
    id: "quick-change",
    name: "Quick-change",
    bars: ["I7", "IV7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "V7"],
  },
  "minor-standard": {
    id: "minor-standard",
    name: "Minor 12-bar",
    bars: ["i7", "i7", "i7", "i7", "iv7", "iv7", "i7", "i7", "V7", "iv7", "i7", "V7"],
  },
};

export function bluesBars(tonic, formId) {
  const form = BLUES_FORMS[formId];
  if (!form) throw new Error(`Unknown blues form: ${formId}`);
  const mode = formId.startsWith("minor") ? "minor" : "major";
  return form.bars.map((n) => chordFromNumeral(tonic, mode, n));
}

export const MAJOR_PROGRESSIONS = [
  {
    id: "pop-axis",
    name: "I–V–vi–IV",
    numerals: ["I", "V", "vi", "IV"],
    blurb: "The four-chord pop progression behind hundreds of songs.",
  },
  {
    id: "classic",
    name: "I–IV–V",
    numerals: ["I", "IV", "V"],
    blurb: "The bedrock cadence of folk, hymns, and early rock and roll.",
  },
  {
    id: "doo-wop",
    name: "I–vi–IV–V",
    numerals: ["I", "vi", "IV", "V"],
    blurb: "The 1950s doo-wop, or “50s changes.”",
  },
  {
    id: "axis-rotation",
    name: "vi–IV–I–V",
    numerals: ["vi", "IV", "I", "V"],
    blurb: "The same four pop chords, starting on the relative minor.",
  },
  {
    id: "pop-variant",
    name: "I–IV–vi–V",
    numerals: ["I", "IV", "vi", "V"],
    blurb: "A common modern pop variant, with vi darkening the color before V.",
  },
  {
    id: "jazz-251",
    name: "ii7–V7–Imaj7",
    numerals: ["ii7", "V7", "Imaj7"],
    blurb: "The essential jazz cadence.",
  },
  {
    id: "circle-short",
    name: "vi–ii–V–I",
    numerals: ["vi", "ii", "V", "I"],
    blurb: "A short descending-fifths (circle of fifths) cell.",
  },
  {
    id: "circle-full",
    name: "I–IV–vii°–iii–vi–ii–V–I",
    numerals: ["I", "IV", "vii°", "iii", "vi", "ii", "V", "I"],
    blurb: "The full diatonic circle of fifths in a major key.",
  },
];

export const MINOR_PROGRESSIONS = [
  {
    id: "minor-145",
    name: "i–iv–v",
    numerals: ["i", "iv", "v"],
    blurb: "The natural-minor version of the basic one–four–five cadence.",
  },
  {
    id: "harmonic-cadence",
    name: "i–iv–V",
    numerals: ["i", "iv", "V"],
    blurb: "Uses the major V from harmonic minor for a stronger pull home.",
  },
  {
    id: "epic-minor",
    name: "i–VI–III–VII",
    numerals: ["i", "VI", "III", "VII"],
    blurb: "A staple of rock and film music in a minor key.",
  },
  {
    id: "andalusian",
    name: "i–VII–VI–V",
    numerals: ["i", "VII", "VI", "V"],
    blurb: "The Andalusian cadence, ending on a major V.",
  },
  {
    id: "aeolian-rock",
    name: "i–VI–VII",
    numerals: ["i", "VI", "VII"],
    blurb: "An Aeolian rock vamp that stays in natural minor.",
  },
  {
    id: "minor-circle",
    name: "i–iv–VII–III–VI–ii°–V–i",
    numerals: ["i", "iv", "VII", "III", "VI", "ii°", "V", "i"],
    blurb: "A circle-of-fifths sequence in minor, with a major V into i.",
  },
];

export function progressionsFor(mode) {
  return mode === "minor" ? MINOR_PROGRESSIONS : MAJOR_PROGRESSIONS;
}

export function keysFor(mode) {
  return mode === "minor" ? MINOR_KEYS : MAJOR_KEYS;
}

export function displayKey(tonic, mode) {
  return mode === "minor" ? `${tonic}m` : tonic;
}

export function diatonicChords(tonic, mode) {
  const numerals =
    mode === "minor"
      ? ["i", "ii°", "III", "iv", "v", "VI", "VII"]
      : ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
  return numerals.map((n) => chordFromNumeral(tonic, mode, n));
}

export function chartMatrix(mode, progressionList = progressionsFor(mode)) {
  const keys = keysFor(mode);
  return keys.map((tonic) => ({
    tonic,
    label: displayKey(tonic, mode),
    rows: progressionList.map((p) => ({
      id: p.id,
      name: p.name,
      chords: progressionChords(tonic, mode, p.numerals),
    })),
  }));
}

/** Semitone of a spelled note in a comfortable mid register (around C3–C5). */
export function noteToMidi(note, octave = 4) {
  const { pc } = parseNote(note);
  return 12 * (octave + 1) + pc; // C4 = 60
}

/**
 * Voicing for playback: keep tones in a mid range, root in a lower octave.
 * Returns MIDI numbers, lowest to highest.
 */
export function chordToMidi(tones, { bassOctave = 3, trebleOctave = 4 } = {}) {
  if (!tones.length) return [];
  const rootMidi = noteToMidi(tones[0], bassOctave);
  const upper = tones.slice(1).map((n) => {
    let m = noteToMidi(n, trebleOctave);
    while (m <= rootMidi) m += 12;
    while (m - rootMidi > 16) m -= 12;
    return m;
  });
  const midRoot = noteToMidi(tones[0], trebleOctave);
  const mid = midRoot <= rootMidi ? midRoot + 12 : midRoot;
  return [rootMidi, mid, ...upper].sort((a, b) => a - b);
}
