/**
 * Lightweight Web Audio playback for triads and seventh chords (strummed guitar voice).
 * No samples, no network. Must be started from a user gesture.
 */

import { chordToMidi } from "./theory.js";

let ctx = null;
let master = null;
let active = [];
let gains = [];
let playToken = 0;

function makeImpulse(audioCtx, seconds = 1.8, decay = 3) {
  const rate = audioCtx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = audioCtx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function getCtx() {
  if (!ctx || ctx.state === "closed") {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    const dry = ctx.createGain();
    dry.gain.value = 0.85;
    const wet = ctx.createGain();
    wet.gain.value = 0.12;
    const verb = ctx.createConvolver();
    verb.buffer = makeImpulse(ctx);
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(dry);
    master.connect(verb);
    verb.connect(wet);
    dry.connect(comp);
    wet.connect(comp);
    comp.connect(ctx.destination);
  }
  return ctx;
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function stopAll() {
  playToken += 1;
  const audioCtx = ctx;
  const t = audioCtx ? audioCtx.currentTime : 0;
  for (const g of gains) {
    try {
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(0.0001, t, 0.03);
    } catch {
      /* ignore */
    }
  }
  for (const node of active) {
    try {
      node.stop(t + 0.15);
    } catch {
      /* already stopped */
    }
  }
  active = [];
  gains = [];
}

// ---- Plucked-string (Karplus-Strong) guitar voice ----
const bufferCache = new Map();

function pluckBuffer(audioCtx, freq, seconds = 3) {
  const key = Math.round(freq * 100);
  if (bufferCache.has(key)) return bufferCache.get(key);
  const rate = audioCtx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = audioCtx.createBuffer(1, len, rate);
  const out = buf.getChannelData(0);
  const period = Math.max(2, Math.round(rate / freq));
  const ring = new Float32Array(period);
  // Slightly low-passed noise burst = softer pick attack.
  let prev = 0;
  for (let i = 0; i < period; i++) {
    const n = Math.random() * 2 - 1;
    prev = prev * 0.5 + n * 0.5;
    ring[i] = prev;
  }
  // Higher strings decay a little faster, like a real guitar.
  const damp = freq > 300 ? 0.994 : 0.997;
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = ring[idx];
    const next = ring[(idx + 1) % period];
    const v = damp * 0.5 * (cur + next);
    ring[idx] = v;
    out[i] = cur;
    idx = (idx + 1) % period;
  }
  bufferCache.set(key, buf);
  return buf;
}

function playString(audioCtx, freq, start, ringFor, gainValue) {
  const src = audioCtx.createBufferSource();
  src.buffer = pluckBuffer(audioCtx, freq);
  const tone = audioCtx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 3200;
  const body = audioCtx.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = 220;
  body.gain.value = 4;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(gainValue, start);
  // Fret-hand mute at the end of the ring time.
  gain.gain.setValueAtTime(gainValue, start + ringFor);
  gain.gain.setTargetAtTime(0.0001, start + ringFor, 0.06);
  src.connect(tone).connect(body).connect(gain).connect(master);
  src.start(start);
  src.stop(start + ringFor + 0.5);
  active.push(src);
  gains.push(gain);
}

/** Spread chord tones over a 5-6 string guitar-like voicing (low to high). */
function guitarVoicing(tones) {
  const midis = chordToMidi(tones);
  const pcs = new Set(midis.map((m) => ((m % 12) + 12) % 12));
  const rootPc = ((midis[0] % 12) + 12) % 12;
  const bass = 40 + ((rootPc - 4 + 12) % 12); // E2..D#3, like an open or barre chord
  const notes = [bass];
  // Greedily stack chord tones upward, at least a minor third apart.
  for (let m = bass + 3; m <= 67 && notes.length < 6; m++) {
    if (pcs.has(((m % 12) + 12) % 12) && m - notes[notes.length - 1] >= (notes.length === 1 ? 7 : 3)) notes.push(m);
  }
  return notes;
}

/** One strum. dir: "down" (low to high) or "up" (high to low, lighter). */
function strum(audioCtx, voicing, start, ringFor, dir, accent) {
  const strings = dir === "up" ? [...voicing].reverse().slice(0, 4) : voicing;
  const spread = dir === "up" ? 0.009 : 0.013;
  const level = (dir === "up" ? 0.09 : 0.13) * accent;
  strings.forEach((midi, i) => {
    playString(audioCtx, midiToFreq(midi), start + i * spread, ringFor, level);
  });
}

// Four strums per chord: down, down, up, down.
const PATTERN = [
  { at: 0, dir: "down", accent: 1.15 },
  { at: 1, dir: "down", accent: 0.9 },
  { at: 2, dir: "up", accent: 0.85 },
  { at: 3, dir: "down", accent: 1.0 },
];

function strumChord(audioCtx, tones, start, chordLen, lastRing) {
  const voicing = guitarVoicing(tones);
  const step = chordLen / 4;
  PATTERN.forEach((p, i) => {
    const t = start + p.at * step;
    const ring = i === PATTERN.length - 1 ? lastRing : step * 0.98;
    strum(audioCtx, voicing, t, ring, p.dir, p.accent);
  });
}

export function stopPlayback() {
  stopAll();
}

export async function playChordTones(tones) {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  stopAll();
  const now = audioCtx.currentTime + 0.03;
  strum(audioCtx, guitarVoicing(tones), now, 2.2, "down", 1.1);
}

export async function playProgression(chords, { beat = 2.0, onIndex, onEnd } = {}) {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  stopAll();
  const token = playToken;
  const now = audioCtx.currentTime + 0.05;

  // "beat" is the length of one chord (four strums).
  chords.forEach((chord, i) => {
    const start = now + i * beat;
    const last = i === chords.length - 1;
    strumChord(audioCtx, chord.tones, start, beat, last ? 1.8 : beat / 4);
  });

  chords.forEach((_, i) => {
    window.setTimeout(() => {
      if (token !== playToken) return;
      if (onIndex) onIndex(i);
    }, i * beat * 1000 + 50);
  });

  const total = chords.length * beat * 1000 + 400;
  window.setTimeout(() => {
    if (token !== playToken) return;
    if (onEnd) onEnd();
  }, total);
}

export function isPlaying() {
  return active.length > 0;
}
