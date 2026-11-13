/**
 * Pure (DOM-free) guitar logic: chord voicings and per-style picking/strumming
 * patterns as timed note events. lib/audio.js plays them with recorded samples.
 */

import { parseNote } from "./theory.js";

// ---------------------------------------------------------------- styles

export const PLAY_STYLES = [
  {
    id: "fingerpick",
    label: "Fingerpicking",
    hint: "Folk Travis picking: alternating thumb bass under a treble pattern",
    bpm: 88,
  },
  { id: "pop", label: "Pop strum", hint: "Acoustic strum: D, D-U, U-D-U", bpm: 96 },
  { id: "ballad", label: "Ballad arpeggio", hint: "Slow broken chords that ring together", bpm: 70 },
];

export const DEFAULT_PLAY_STYLE = "fingerpick";

export function playStyleById(id) {
  return PLAY_STYLES.find((s) => s.id === id) || PLAY_STYLES.find((s) => s.id === DEFAULT_PLAY_STYLE);
}

/** Per-style output trim so styles sit at a similar loudness (tuned offline). */
const STYLE_TRIM = { fingerpick: 1.1, pop: 0.95, ballad: 1.25 };

// ---------------------------------------------------------------- helpers

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Small deterministic PRNG so renders are repeatable. */
export function makeRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- voicings

const OPEN_STRINGS = [40, 45, 50, 55, 59, 64];

function chordShape(chord) {
  const rootPc = parseNote(chord.tones[0]).pc;
  const ivals = chord.tones.map((n) => (parseNote(n).pc - rootPc + 12) % 12);
  const third = ivals.find((i) => i === 3 || i === 4);
  const fifth = ivals.find((i) => i === 6 || i === 7 || i === 8);
  const seventh = ivals.find((i) => i === 9 || i === 10 || i === 11);
  return { rootPc, ivals, third, fifth, seventh };
}

/** Intervals (above the root) a style wants on top of the bass. */
function colorIntervals(chord, style) {
  const sh = chordShape(chord);
  const third = sh.third ?? 4;
  const fifth = sh.fifth ?? 7;
  // Strum / fingerpick / ballad: plain chord tones (7th replaces a doubled root).
  return sh.seventh != null ? [third, fifth, sh.seventh] : [0, third, fifth];
}

function pc(m) {
  return ((m % 12) + 12) % 12;
}

/** Pick the upper-structure voicing closest to the previous one. */
function voiceUpper(rootPc, ivals, { lo, hi, center, prev, maxSpan = 14 }) {
  const options = ivals.map((iv) => {
    const target = pc(rootPc + iv);
    const list = [];
    for (let m = lo; m <= hi; m++) if (pc(m) === target) list.push(m);
    return list;
  });
  let best = null;
  let bestCost = Infinity;
  const pick = (k, acc) => {
    if (k === options.length) {
      const v = [...acc].sort((x, y) => x - y);
      for (let i = 1; i < v.length; i++) if (v[i] - v[i - 1] < 2) return; // no minor-2nd rubs
      if (v[v.length - 1] - v[0] > maxSpan) return;
      const mean = v.reduce((s, x) => s + x, 0) / v.length;
      let cost = 0.35 * Math.abs(mean - center);
      if (prev && prev.length === v.length) cost += v.reduce((s, x, i) => s + Math.abs(x - prev[i]), 0);
      else if (prev) cost += Math.abs(mean - prev.reduce((s, x) => s + x, 0) / prev.length);
      if (cost < bestCost) {
        bestCost = cost;
        best = v;
      }
      return;
    }
    for (const m of options[k]) pick(k + 1, [...acc, m]);
  };
  pick(0, []);
  return best || ivals.map((iv) => 60 + pc(rootPc + iv)).sort((x, y) => x - y);
}

/**
 * Full voicing for a chord in a given style.
 * Returns { bass, alt, upper, strum } as MIDI numbers.
 */
export function voiceChord(chord, style, prevUpper, low = false) {
  const sh = chordShape(chord);
  const bass = 40 + ((sh.rootPc - 4 + 12) % 12); // E2..D#3, like an open or barre chord
  const alt = sh.fifth != null ? bass + sh.fifth : bass + 12;
  const ivals = colorIntervals(chord, style);
  let range;
  if (low) range = { lo: Math.max(alt + 3, 52), hi: 66, center: 60, maxSpan: 12 };
  else if (style === "pop") range = { lo: Math.max(alt + 3, 52), hi: 72, center: 63, maxSpan: 12 };
  else range = { lo: Math.max(alt + 3, 55), hi: 74, center: 65, maxSpan: 12 };
  const upper = voiceUpper(sh.rootPc, ivals, { ...range, prev: prevUpper });
  // Strum shape: bass, fifth, (octave), triad on top, like a real 5-6 string grip.
  const strumNotes = [bass, alt];
  if (bass + 12 < upper[0] - 2 && bass + 12 > alt) strumNotes.push(bass + 12);
  const strumShape = [...strumNotes, ...upper].slice(0, 6);
  return { bass, alt, upper, strum: strumShape };
}

/** Map each note of a grip to a string index (0 = low E). */
function assignStrings(notes) {
  const sorted = [...new Set(notes)].sort((a, b) => a - b);
  const n = sorted.length;
  const map = new Map();
  let prevS = -1;
  sorted.forEach((m, k) => {
    let ideal = OPEN_STRINGS.findIndex((o) => m - o <= 5);
    if (ideal < 0) ideal = 5;
    const s = Math.min(Math.max(prevS + 1, ideal), 5 - (n - 1 - k), 5);
    map.set(m, Math.max(0, s));
    prevS = s;
  });
  return map;
}

// ---------------------------------------------------------------- patterns

/** Beat position (in beats) for an 8th/16th slot with swing (0.5 = straight). */
function swung(slot, perBeat, swing) {
  const sub = 1 / perBeat;
  const pair = Math.floor(slot / 2);
  const odd = slot % 2 === 1;
  return pair * 2 * sub + (odd ? 2 * sub * swing : 0);
}

/** Cut notes at the next chord change and when their string is re-plucked. */
function applyCuts(events, chordStarts) {
  events.forEach((e) => {
    const ci = chordStarts.findIndex(
      (s, i) => e.t >= s - 1e-6 && (i === chordStarts.length - 1 || e.t < chordStarts[i + 1] - 1e-6)
    );
    if (ci >= 0 && ci < chordStarts.length - 1) e.end = Math.min(e.end, chordStarts[ci + 1] + 0.04);
  });
  const byString = new Map();
  events.forEach((e) => {
    if (!byString.has(e.s)) byString.set(e.s, []);
    byString.get(e.s).push(e);
  });
  for (const list of byString.values()) {
    list.sort((a, b) => a.t - b.t);
    for (let i = 0; i < list.length - 1; i++) {
      const nxt = list[i + 1];
      if (nxt.t > list[i].t) list[i].end = Math.min(list[i].end, nxt.t + 0.01);
    }
  }
  events.sort((a, b) => a.t - b.t);
}

/**
 * Build the note events for a progression.
 * Returns { events, chordStarts, total } with times in seconds from 0.
 * Event: { t, midi, end, gain, s (string 0-5), palm (palm-muted) }
 */
export function buildEvents(chords, styleId, { tempoScale = 1, seed = 1, low = false, gainScale = 1 } = {}) {
  const style = playStyleById(styleId);
  const id = style.id;
  const rng = makeRng(seed);
  const jit = (ms) => (rng() * 2 - 1) * ms * 0.001;
  const vel = (amt) => 1 + (rng() * 2 - 1) * amt;
  const beatLen = 60 / (style.bpm * tempoScale);
  const barLen = beatLen * 4;
  const trim = (STYLE_TRIM[id] ?? 1) * gainScale;
  const events = [];
  const chordStarts = [];
  let prevUpper = null;

  const note = (t, midi, ring, gain, s) => {
    events.push({ t: Math.max(0, t), midi, end: t + ring, gain: gain * trim, s, palm: false });
  };

  const strumAt = (t, grip, strings, dir, level, ring, spreadOverride) => {
    const list = dir === "up" ? [...grip].reverse() : grip;
    const spread = spreadOverride ?? (dir === "up" ? 0.009 : 0.013);
    list.forEach((m, k) => {
      const g = level * Math.pow(dir === "up" ? 0.94 : 0.97, k) * vel(0.06);
      note(t + k * spread + jit(1.5), m, ring, g, strings.get(m));
    });
  };

  let t0 = 0;
  chords.forEach((chord, ci) => {
    const last = ci === chords.length - 1;
    const v = voiceChord(chord, id, prevUpper, low);
    prevUpper = v.upper;
    const strings = assignStrings([...v.strum, v.bass, v.alt, ...v.upper]);
    const at = (beats) => t0 + beats * beatLen;
    chordStarts.push(t0);

    if (last) {
      // Ending: one let-ring gesture instead of a full bar.
      if (id === "pop") {
        strumAt(t0, v.strum, assignStrings(v.strum), "down", 0.3, 3.6, 0.02);
      } else {
        note(t0, v.bass, 3.8, 0.42, strings.get(v.bass));
        [v.alt, ...v.upper].forEach((m, k) =>
          note(t0 + (k + 1) * 0.085, m, 3.8 - k * 0.085, 0.3 * vel(0.05), strings.get(m))
        );
      }
      t0 += 3.4;
      return;
    }

    if (id === "pop") {
      // D . D U . U D U  (the classic pop strum), bass included on beat 1 only.
      const hits = [
        { b: 0, dir: "down", lvl: 0.3, full: true },
        { b: 1, dir: "down", lvl: 0.24 },
        { b: 1.5, dir: "up", lvl: 0.17 },
        { b: 2.5, dir: "up", lvl: 0.18 },
        { b: 3, dir: "down", lvl: 0.24 },
        { b: 3.5, dir: "up", lvl: 0.16 },
      ];
      hits.forEach((h) => {
        let grip = v.strum;
        if (h.dir === "up") grip = v.strum.slice(-4);
        else if (!h.full) grip = v.strum.slice(1);
        strumAt(at(h.b) + jit(4), grip, strings, h.dir, h.lvl, 2.0);
      });
    } else if (id === "fingerpick") {
      // Travis picking: thumb on every beat (root / fifth), fingers on the "ands".
      const [u0, u1, u2] = v.upper;
      const plan = [[v.bass, u2], [u1], [v.alt], [u2], [v.bass], [u1], [v.alt], [u0]];
      plan.forEach((ns, slot) => {
        const t = at(swung(slot, 2, 0.56)) + jit(5);
        ns.forEach((m) => {
          const isBass = m === v.bass || m === v.alt;
          if (isBass) note(t, m, 1.2, 0.42 * vel(0.06), strings.get(m));
          else note(t, m, 2.0, (m === u2 ? 0.36 : 0.31) * vel(0.08), strings.get(m));
        });
      });
    } else {
      // Ballad: broken chord up and back down, everything rings.
      const [u0, u1, u2] = v.upper;
      const seq = [v.bass, v.alt, u0, u1, u2, u1, u0, v.alt];
      seq.forEach((m, slot) => {
        const t = at(slot * 0.5) + jit(6);
        const g = slot === 0 ? 0.44 : m === u2 ? 0.34 : 0.3;
        note(t, m, 3.4, g * vel(0.06), strings.get(m));
      });
    }
    t0 += barLen;
  });

  applyCuts(events, chordStarts);
  return { events, chordStarts, total: t0 };
}

/**
 * Blues shuffle: the classic boogie riff (root+5th / root+6th / root+b7) in swung
 * eighths, palm-muted, plus a let-ring hit on the final bar.
 * barLen: seconds per bar.
 */
const SHUFFLE_RIFF = [7, 7, 9, 9, 10, 10, 9, 9];

export function buildShuffleEvents(chords, barLen = 2.0, { seed = 1, gainScale = 1 } = {}) {
  const rng = makeRng(seed);
  const vel = (amt) => 1 + (rng() * 2 - 1) * amt;
  const events = [];
  const chordStarts = [];
  chords.forEach((chord, ci) => {
    const start = ci * barLen;
    chordStarts.push(start);
    const root = voiceChord(chord, "pop", null).bass;
    const last = ci === chords.length - 1;
    const beatLen = barLen / 4;
    SHUFFLE_RIFF.forEach((interval, i) => {
      const beat = Math.floor(i / 2);
      const offbeat = i % 2 === 1;
      const t = start + beat * beatLen + (offbeat ? beatLen * (2 / 3) : 0);
      const len = offbeat ? beatLen / 3 : beatLen * (2 / 3);
      const isLast = last && i === SHUFFLE_RIFF.length - 1;
      const ring = isLast ? 2.4 : len * 0.95;
      const accent = (offbeat ? 0.78 : beat % 2 === 0 ? 1.12 : 1.0) * vel(0.05);
      const level = 0.42 * accent * gainScale;
      const palm = !isLast;
      events.push({ t, midi: root, end: t + ring, gain: level, s: 0, palm });
      events.push({ t: t + 0.006, midi: root + interval, end: t + ring, gain: level * 0.85, s: 1, palm });
      events.push({ t: t + 0.012, midi: root + 12, end: t + ring, gain: level * 0.5, s: 2, palm });
    });
  });
  events.sort((a, b) => a.t - b.t);
  return { events, chordStarts, total: chords.length * barLen + 1.2 };
}

/** Single chord click: one natural down strum. */
export function buildChordEvents(chord) {
  const v = voiceChord(chord, "pop", null);
  const strings = assignStrings(v.strum);
  return v.strum.map((m, k) => ({
    t: k * 0.016,
    midi: m,
    end: 3.0,
    gain: 0.3 * Math.pow(0.97, k),
    s: strings.get(m),
    palm: false,
  }));
}

// ---------------------------------------------------------------- samples

/** Recorded steel-string guitar notes, self-hosted in public/samples/guitar/<midi>.mp3 */
export const SAMPLE_NOTES = [40, 43, 46, 49, 52, 55, 58, 61, 64, 67, 69, 72];

export function nearestSample(midi) {
  let best = SAMPLE_NOTES[0];
  for (const n of SAMPLE_NOTES) {
    // Prefer pitching a sample down over up when equidistant (sounds more natural).
    if (Math.abs(n - midi) < Math.abs(best - midi) || (Math.abs(n - midi) === Math.abs(best - midi) && n > best)) best = n;
  }
  return best;
}

/** Nylon-string notes used for melody phrases (public/samples/lead/<midi>.mp3). */
export const LEAD_NOTES = [52, 55, 59, 61, 64, 66, 69, 71, 73, 76, 79, 81];

export function nearestOf(list, midi) {
  let best = list[0];
  for (const n of list) if (Math.abs(n - midi) < Math.abs(best - midi)) best = n;
  return best;
}

/** Map a melody beat to a time in beats, optionally with swung eighths. */
export function swingBeat(beat, swing) {
  if (!swing) return beat;
  const whole = Math.floor(beat + 1e-9);
  const f = beat - whole;
  const mapped = f < 0.5 ? (f / 0.5) * (2 / 3) : 2 / 3 + ((f - 0.5) / 0.5) * (1 / 3);
  return whole + mapped;
}

export const TONE = {
  inputGain: 1.2,
  highpass: 70,
  air: { freq: 6000, gain: 1.5 },
  palmLowpass: 1100,
  pans: [-0.28, -0.17, -0.06, 0.06, 0.17, 0.28],
  dry: 0.9,
  wet: 0.16,
  reverbSeconds: 1.6,
  preDelay: 0.015,
  release: 0.07,
  palmRelease: 0.025,
};
