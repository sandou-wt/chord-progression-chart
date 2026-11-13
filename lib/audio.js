/**
 * Lightweight Web Audio playback for triads and seventh chords (soft piano voice).
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
    wet.gain.value = 0.22;
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

/**
 * Soft electric-piano style note: quick attack, gentle decay,
 * held sustain while the chord lasts, then a natural release tail.
 */
function playTone(audioCtx, freq, start, hold, gainValue, release = 1.2) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const osc3 = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();
  const g3 = audioCtx.createGain();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(freq, start);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2, start);
  osc2.detune.setValueAtTime(4, start);
  osc3.type = "sine";
  osc3.frequency.setValueAtTime(freq, start);
  osc3.detune.setValueAtTime(-6, start);
  g2.gain.setValueAtTime(0.25, start);
  g3.gain.setValueAtTime(0.5, start);

  filter.type = "lowpass";
  filter.Q.value = 0.4;
  filter.frequency.setValueAtTime(2600, start);
  filter.frequency.exponentialRampToValueAtTime(900, start + hold + release);

  const peak = gainValue;
  const end = start + hold;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(peak * 0.5, start + 0.35);
  gain.gain.exponentialRampToValueAtTime(peak * 0.32, Math.max(start + 0.4, end));
  gain.gain.exponentialRampToValueAtTime(0.0001, end + release);

  osc1.connect(filter);
  osc2.connect(g2).connect(filter);
  osc3.connect(g3).connect(filter);
  filter.connect(gain);
  gain.connect(master);

  const stopAt = end + release + 0.05;
  [osc1, osc2, osc3].forEach((o) => {
    o.start(start);
    o.stop(stopAt);
  });
  active.push(osc1, osc2, osc3);
  gains.push(gain);
}

function voiceChord(audioCtx, tones, start, hold, release) {
  const midis = chordToMidi(tones);
  const root = midis[0];
  // Bass an octave below the root, then a gentle upward roll.
  playTone(audioCtx, midiToFreq(root - 12), start, hold, 0.1, release);
  midis.forEach((midi, n) => {
    playTone(audioCtx, midiToFreq(midi), start + 0.03 + n * 0.035, hold, n === 0 ? 0.07 : 0.055, release);
  });
}

export function stopPlayback() {
  stopAll();
}

export async function playChordTones(tones, { duration = 1.8 } = {}) {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  stopAll();
  const now = audioCtx.currentTime + 0.03;
  voiceChord(audioCtx, tones, now, duration, 1.4);
}

export async function playProgression(chords, { beat = 1.6, onIndex, onEnd } = {}) {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  stopAll();
  const token = playToken;
  const now = audioCtx.currentTime + 0.05;

  chords.forEach((chord, i) => {
    const start = now + i * beat;
    const last = i === chords.length - 1;
    // Hold until the next chord, then let the tail overlap slightly.
    voiceChord(audioCtx, chord.tones, start, last ? beat * 1.2 : beat * 0.95, last ? 1.8 : 0.6);
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
