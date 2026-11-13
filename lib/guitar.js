/**
 * Pure (DOM-free) guitar engine: Karplus-Strong string synthesis, chord voicings
 * and per-style picking/strumming patterns. lib/audio.js turns the events into
 * Web Audio nodes; scripts/render-check.mjs renders them offline for level checks.
 */

import { parseNote } from "./theory.js";

// ---------------------------------------------------------------- styles

export const PLAY_STYLES = [
  {
    id: "fingerpick",
    label: "Fingerpicking",
    hint: "Folk Travis picking: alternating thumb bass under a treble pattern",
    bpm: 92,
  },
  { id: "pop", label: "Pop strum", hint: "Bright acoustic strum: D, D-U, U-D-U", bpm: 100 },
  { id: "ballad", label: "Ballad arpeggio", hint: "Slow broken chords that ring together", bpm: 70 },
  { id: "funk", label: "Funk", hint: "Muted sixteenth-note chops on the top strings", bpm: 96 },
  { id: "neosoul", label: "Neo-soul", hint: "Soft rolled 7th and 9th chords with a lazy swing", bpm: 68 },
];

export const DEFAULT_PLAY_STYLE = "fingerpick";

export function playStyleById(id) {
  return PLAY_STYLES.find((s) => s.id === id) || PLAY_STYLES.find((s) => s.id === DEFAULT_PLAY_STYLE);
}

/** Per-style output trim so styles sit at a similar loudness (tuned offline). */
const STYLE_TRIM = { fingerpick: 0.95, pop: 1.12, ballad: 1.2, funk: 1.05, neosoul: 1.3 };

// ---------------------------------------------------------------- string synthesis

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

/** Natural ring time (to -60 dB) of a fresh steel string at this pitch. */
export function ringTime(freq) {
  return 9.0 * Math.pow(82.4 / freq, 0.5);
}

/**
 * Karplus-Strong plucked steel string.
 * bright: 0..1 pick brightness. mute: palm/fret-muted short "chk".
 * Extended KS: DC-free pick-position-filtered excitation, a weighted two-point
 * loop filter (brighter than plain averaging) and an all-pass for exact tuning.
 */
export function synthPluck(rate, freq, { bright = 0.75, mute = false, seed = 7 } = {}) {
  const rng = makeRng(seed + Math.round(freq * 13));
  const t60 = mute ? 0.09 : ringTime(freq);
  const seconds = mute ? 0.2 : Math.min(3.6, t60 * 0.7 + 0.3);
  const len = Math.floor(rate * seconds);
  const out = new Float32Array(len);

  const S = mute ? 0.5 : freq < 150 ? 0.3 : 0.22; // loop low-pass weight (0.5 = darkest)
  const D = rate / freq;
  const N = Math.max(2, Math.floor(D - S - 0.1));
  const d = D - S - N; // fractional delay for the all-pass, in [0.1, 1.1)
  const C = (1 - d) / (1 + d);
  const rho = Math.pow(10, -3 / (t60 * freq)); // loss per round trip

  // Excitation: one period of noise, low-passed by pick softness, then a
  // pick-position comb (plucking near the bridge = twangier, brighter).
  const ex = new Float32Array(N);
  const a = mute ? 0.75 : 0.7 - 0.5 * bright; // one-pole smoothing
  let lp = 0;
  for (let i = 0; i < N; i++) {
    lp = lp * a + (rng() * 2 - 1) * (1 - a);
    ex[i] = lp;
  }
  const pick = Math.max(1, Math.round(N * (mute ? 0.25 : 0.13)));
  const shaped = new Float32Array(N);
  for (let i = 0; i < N; i++) shaped[i] = ex[i] - (i >= pick ? ex[i - pick] : 0);
  let mean = 0;
  for (let i = 0; i < N; i++) mean += shaped[i];
  mean /= N;
  let peak = 1e-9;
  for (let i = 0; i < N; i++) {
    shaped[i] -= mean; // no DC: no thump, no offset at note-off
    peak = Math.max(peak, Math.abs(shaped[i]));
  }
  for (let i = 0; i < N; i++) shaped[i] /= peak;

  const line = shaped;
  let idx = 0;
  let xPrev = 0;
  let apX = 0;
  let apY = 0;
  for (let i = 0; i < len; i++) {
    const x = line[idx];
    out[i] = x;
    const f = rho * ((1 - S) * x + S * xPrev);
    xPrev = x;
    const y = C * f + apX - C * apY;
    apX = f;
    apY = y;
    line[idx] = y;
    idx = idx + 1 === N ? 0 : idx + 1;
  }
  // Remove any residual DC from the first period and fade the tail.
  const fade = Math.min(len, Math.floor(rate * 0.05));
  for (let i = 0; i < fade; i++) out[len - 1 - i] *= i / fade;
  // A 1 ms fade-in keeps the first sample from clicking when bright.
  const fin = Math.floor(rate * 0.001);
  for (let i = 0; i < fin; i++) out[i] *= i / fin;
  return out;
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
  const isV = /^V$/.test(chord.numeral || "");
  if (style === "neosoul") {
    // Rootless 4-note colour voicings: maj9, m9, dominant 9, m7b5.
    if (fifth === 6) return [third, fifth, sh.seventh ?? 10, 12];
    if (third === 3) return [3, 7, sh.seventh ?? 10, 14];
    const sev = sh.seventh ?? (isV ? 10 : 11);
    return [4, 7, sev, 14];
  }
  if (style === "funk") {
    if (third === 3 && fifth === 7) return [3, 7, sh.seventh ?? 10]; // m7 chop
    if (third === 4 && (isV || sh.seventh === 10)) return [4, 10, 14]; // the classic "9 chord" chop
    return sh.seventh != null ? [third, fifth, sh.seventh] : [0, third, fifth];
  }
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
export function voiceChord(chord, style, prevUpper) {
  const sh = chordShape(chord);
  const bass = 40 + ((sh.rootPc - 4 + 12) % 12); // E2..D#3, like an open or barre chord
  const alt = sh.fifth != null ? bass + sh.fifth : bass + 12;
  const ivals = colorIntervals(chord, style);
  let range;
  if (style === "funk") range = { lo: 60, hi: 79, center: 69, maxSpan: 12 };
  else if (style === "neosoul") range = { lo: Math.max(bass + 10, 52), hi: 77, center: 64, maxSpan: 14 };
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

/**
 * Build the note events for a progression.
 * Returns { events, chordStarts, total } with times in seconds from 0.
 * Event: { t, midi, end, gain, s, bright, mute, attack, dbl }
 */
export function buildEvents(chords, styleId, { tempoScale = 1, seed = 1 } = {}) {
  const style = playStyleById(styleId);
  const id = style.id;
  const rng = makeRng(seed);
  const jit = (ms) => (rng() * 2 - 1) * ms * 0.001;
  const vel = (amt) => 1 + (rng() * 2 - 1) * amt;
  const beatLen = 60 / (style.bpm * tempoScale);
  const barLen = beatLen * 4;
  const trim = STYLE_TRIM[id] ?? 1;
  const events = [];
  const chordStarts = [];
  let prevUpper = null;

  const note = (t, midi, ring, gain, s, extra = {}) => {
    events.push({
      t: Math.max(0, t),
      midi,
      end: t + ring,
      gain: gain * trim,
      s,
      bright: 0.75,
      mute: false,
      attack: 0.002,
      dbl: true,
      ...extra,
    });
  };

  const strumAt = (t, grip, strings, dir, level, ring, extra = {}) => {
    const list = dir === "up" ? [...grip].reverse() : grip;
    const spread = extra.spread ?? (dir === "up" ? 0.007 : 0.01);
    list.forEach((m, k) => {
      const g = level * Math.pow(dir === "up" ? 0.95 : 0.97, k) * vel(0.06);
      note(t + k * spread + jit(1.5), m, ring, g, strings.get(m), extra);
    });
  };

  let t0 = 0;
  chords.forEach((chord, ci) => {
    const last = ci === chords.length - 1;
    const v = voiceChord(chord, id, prevUpper);
    prevUpper = v.upper;
    const strings = assignStrings([...v.strum, v.bass, v.alt, ...v.upper]);
    const at = (beats) => t0 + beats * beatLen;
    chordStarts.push(t0);

    if (last) {
      // Ending: one let-ring gesture instead of a full bar.
      if (id === "pop" || id === "funk") {
        const shape = id === "funk" ? voiceChord(chord, "pop", null).strum : v.strum;
        strumAt(t0, shape, assignStrings(shape), "down", 0.15, 3.0, { spread: 0.016, bright: 0.8 });
      } else {
        const soft = id === "neosoul";
        const roll = soft ? 0.07 : 0.085;
        const bright = soft ? 0.5 : 0.72;
        note(t0, v.bass, 3.4, 0.24, strings.get(v.bass), { bright });
        const ups = soft ? v.upper : [v.alt, ...v.upper];
        ups.forEach((m, k) =>
          note(t0 + (k + 1) * roll, m, 3.4 - k * roll, (soft ? 0.14 : 0.17) * vel(0.05), strings.get(m), {
            bright,
            attack: soft ? 0.008 : 0.002,
          })
        );
      }
      t0 += 3.2;
      return;
    }

    if (id === "pop") {
      // D . D U . U D U  (the classic pop/calypso strum), bass hit on beat 1.
      const hits = [
        { b: 0, dir: "down", lvl: 0.15, full: true },
        { b: 1, dir: "down", lvl: 0.115 },
        { b: 1.5, dir: "up", lvl: 0.085 },
        { b: 2.5, dir: "up", lvl: 0.09 },
        { b: 3, dir: "down", lvl: 0.115 },
        { b: 3.5, dir: "up", lvl: 0.08 },
      ];
      hits.forEach((h) => {
        let grip = v.strum;
        if (h.dir === "up") grip = v.strum.slice(-4);
        else if (!h.full) grip = v.strum.slice(1);
        strumAt(at(h.b) + jit(4), grip, strings, h.dir, h.lvl, 1.6, {
          bright: h.dir === "up" ? 0.85 : 0.78,
        });
      });
    } else if (id === "fingerpick") {
      // Travis picking: thumb on every beat (root / fifth), fingers on the "ands".
      const [u0, u1, u2] = v.upper;
      const plan = [
        [v.bass, u2],
        [u1],
        [v.alt],
        [u2],
        [v.bass],
        [u1],
        [v.alt],
        [u0],
      ];
      plan.forEach((ns, slot) => {
        const t = at(swung(slot, 2, 0.57)) + jit(5);
        ns.forEach((m) => {
          const isBass = m === v.bass || m === v.alt;
          if (isBass) note(t, m, 0.75, 0.25 * vel(0.06), strings.get(m), { bright: 0.6 });
          else note(t, m, 1.4, (m === u2 ? 0.2 : 0.17) * vel(0.08), strings.get(m), { bright: 0.8 });
        });
      });
    } else if (id === "ballad") {
      // Broken chord up and back down: root, fifth, then the triad up top.
      const [u0, u1, u2] = v.upper;
      const seq = [v.bass, v.alt, u0, u1, u2, u1, u0, v.alt];
      seq.forEach((m, slot) => {
        const t = at(slot * 0.5) + jit(6);
        const g = slot === 0 ? 0.26 : m === u2 ? 0.19 : 0.16;
        note(t, m, 3.0, g * vel(0.06), strings.get(m), { bright: 0.7 });
      });
    } else if (id === "funk") {
      // 16ths: X accent chop, x light chop, g ghost scratch, . rest.
      const pattern = "XggxgXg.Xg.xgXgg";
      for (let slot = 0; slot < 16; slot++) {
        const ch = pattern[slot];
        if (ch === ".") continue;
        const t = at(swung(slot, 4, 0.54)) + jit(3);
        const dir = slot % 2 === 0 ? "down" : "up";
        if (ch === "g") {
          strumAt(t, v.upper, strings, dir, 0.11, 0.03, { mute: true, bright: 0.35, dbl: false, spread: 0.004 });
        } else {
          const lvl = ch === "X" ? 0.15 : 0.11;
          strumAt(t, v.upper, strings, dir, lvl, ch === "X" ? 0.12 : 0.08, { bright: 0.85, spread: 0.005 });
        }
      }
      // Low root to anchor the harmony.
      note(at(0), v.bass, 0.38, 0.22, strings.get(v.bass), { bright: 0.55 });
      note(at(swung(10, 4, 0.54)), v.bass + 12, 0.2, 0.16, strings.get(v.alt), { bright: 0.55 });
    } else if (id === "neosoul") {
      // Bass + slow soft roll, light top-note answers, a rolled-down comp, soft fifth.
      const sw = (slot) => at(swung(slot, 4, 0.62)) + jit(6);
      const soft = { bright: 0.5, attack: 0.008 };
      note(sw(0), v.bass, 1.9, 0.25, strings.get(v.bass), soft);
      v.upper.forEach((m, k) => note(sw(0) + 0.04 + k * 0.045, m, 2.2, 0.13 * vel(0.06), strings.get(m), soft));
      v.upper.slice(-2).forEach((m, k) => note(sw(6) + k * 0.03, m, 0.9, 0.085 * vel(0.08), strings.get(m), soft));
      [...v.upper].reverse().slice(0, 3).forEach((m, k) =>
        note(sw(10) + k * 0.035, m, 1.2, 0.1 * vel(0.06), strings.get(m), soft)
      );
      note(sw(12), v.alt, 0.9, 0.16, strings.get(v.alt), soft);
      note(sw(15), v.bass + 12, 0.5, 0.11, strings.get(v.bass + 12) ?? 2, soft);
    }
    t0 += barLen;
  });

  // A new chord shape stops the old one; a re-struck string stops its last note.
  const starts = chordStarts;
  events.forEach((e) => {
    const ci = starts.findIndex((s, i) => e.t >= s && (i === starts.length - 1 || e.t < starts[i + 1]));
    e.chord = ci;
    if (ci < starts.length - 1) e.end = Math.min(e.end, starts[ci + 1] + 0.035);
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
      if (nxt.t > list[i].t) list[i].end = Math.min(list[i].end, nxt.t + 0.008);
    }
  }
  events.sort((a, b) => a.t - b.t);
  return { events, chordStarts, total: t0 };
}

/** Single chord click: one bright down strum. */
export function buildChordEvents(chord) {
  const v = voiceChord(chord, "pop", null);
  const strings = assignStrings(v.strum);
  return v.strum.map((m, k) => ({
    t: k * 0.014,
    midi: m,
    end: 2.6,
    gain: 0.16 * Math.pow(0.97, k),
    s: strings.get(m),
    bright: 0.8,
    mute: false,
    attack: 0.002,
    dbl: true,
  }));
}

// ---------------------------------------------------------------- tone settings

/** Shared "pop acoustic" bus EQ, used by audio.js and the offline checker. */
export const POP_TONE = {
  inputGain: 2.0,
  highpass: 80,
  mud: { freq: 280, gain: -3.5, q: 1.0 },
  presence: { freq: 3000, gain: 2, q: 0.9 },
  air: { freq: 8000, gain: 3.5 },
  lowpass: 15000,
  doubleCents: 5,
  doubleDelay: 0.009,
  doubleGain: 0.42,
  pans: [-0.32, -0.19, -0.06, 0.06, 0.19, 0.32],
  dry: 0.9,
  wet: 0.2,
  reverbSeconds: 1.4,
  preDelay: 0.014,
};
