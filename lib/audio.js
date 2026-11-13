/**
 * Web Audio playback (no samples, no network). Must be started from a user gesture.
 * - Pop acoustic voice (lib/guitar.js): extended Karplus-Strong strings, doubled with a
 *   slight detune for shimmer, panned per string, bright EQ, short reverb. Used for
 *   chord clicks and every progression playing style.
 * - Classic voice (below): the original darker strings, kept for the blues shuffle riff.
 */

import { chordToMidi } from "./theory.js";
import {
  buildEvents,
  buildChordEvents,
  synthPluck,
  midiToFreq as guitarFreq,
  POP_TONE,
  PLAY_STYLES,
  DEFAULT_PLAY_STYLE,
} from "./guitar.js";

export { PLAY_STYLES, DEFAULT_PLAY_STYLE };

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
    pop = buildPopBus(ctx);
  }
  return ctx;
}

// ---- Pop acoustic bus: EQ -> dry + short pre-delayed reverb -> glue comp -> limiter ----
let pop = null;
let scheduler = null;

function popImpulse(audioCtx, seconds) {
  const rate = audioCtx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = audioCtx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / rate;
      const k = 0.55 - 0.4 * (i / len); // tail gets darker as it decays
      lp += k * ((Math.random() * 2 - 1) - lp);
      data[i] = lp * Math.exp((-6.9 * t) / seconds) * Math.min(1, t / 0.004);
    }
  }
  return buf;
}

function buildPopBus(audioCtx) {
  const T = POP_TONE;
  const input = audioCtx.createGain();
  input.gain.value = T.inputGain;
  const hp = audioCtx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = T.highpass;
  hp.Q.value = 0.7;
  const mud = audioCtx.createBiquadFilter();
  mud.type = "peaking";
  mud.frequency.value = T.mud.freq;
  mud.Q.value = T.mud.q;
  mud.gain.value = T.mud.gain;
  const presence = audioCtx.createBiquadFilter();
  presence.type = "peaking";
  presence.frequency.value = T.presence.freq;
  presence.Q.value = T.presence.q;
  presence.gain.value = T.presence.gain;
  const air = audioCtx.createBiquadFilter();
  air.type = "highshelf";
  air.frequency.value = T.air.freq;
  air.gain.value = T.air.gain;
  const lp = audioCtx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = T.lowpass;
  lp.Q.value = 0.7;
  input.connect(hp).connect(mud).connect(presence).connect(air).connect(lp);

  const glue = audioCtx.createDynamicsCompressor();
  glue.threshold.value = -14;
  glue.knee.value = 8;
  glue.ratio.value = 3;
  glue.attack.value = 0.004;
  glue.release.value = 0.18;
  const limiter = audioCtx.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.1;

  const dry = audioCtx.createGain();
  dry.gain.value = T.dry;
  const pre = audioCtx.createDelay(0.1);
  pre.delayTime.value = T.preDelay;
  const verb = audioCtx.createConvolver();
  verb.buffer = popImpulse(audioCtx, T.reverbSeconds);
  const wet = audioCtx.createGain();
  wet.gain.value = T.wet;
  lp.connect(dry).connect(glue);
  lp.connect(pre).connect(verb).connect(wet).connect(glue);
  glue.connect(limiter).connect(audioCtx.destination);

  // One panner per string (low strings a little left, high a little right).
  const pans = T.pans.map((p) => {
    if (typeof audioCtx.createStereoPanner === "function") {
      const node = audioCtx.createStereoPanner();
      node.pan.value = p;
      node.connect(input);
      return node;
    }
    const node = audioCtx.createGain();
    node.connect(input);
    return node;
  });
  return { input, pans };
}

const popCache = new Map();
function popBuffer(audioCtx, e) {
  const bright = Math.round(e.bright * 20) / 20;
  const key = `${e.midi}|${e.mute ? 1 : 0}|${bright}`;
  let buf = popCache.get(key);
  if (!buf) {
    if (popCache.size > 160) popCache.clear();
    const data = synthPluck(audioCtx.sampleRate, guitarFreq(e.midi), { bright, mute: e.mute });
    buf = audioCtx.createBuffer(1, data.length, audioCtx.sampleRate);
    buf.getChannelData(0).set(data);
    popCache.set(key, buf);
  }
  return buf;
}

function popVoice(audioCtx, buf, start, end, level, attack, release, panNode, rate) {
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(level, start + attack);
  if (end > start + attack) g.gain.setValueAtTime(level, end);
  g.gain.setTargetAtTime(0, Math.max(end, start + attack), release);
  src.connect(g).connect(panNode);
  src.start(start);
  src.stop(Math.max(end, start + attack) + release * 8);
  active.push(src);
  gains.push(g);
  src.onended = () => {
    const i = active.indexOf(src);
    if (i >= 0) active.splice(i, 1);
    const j = gains.indexOf(g);
    if (j >= 0) gains.splice(j, 1);
    try {
      g.disconnect();
    } catch {
      /* ignore */
    }
  };
}

/** Schedule one guitar event (times relative to `base`, in AudioContext seconds). */
function playPopEvent(audioCtx, e, base) {
  const T = POP_TONE;
  const buf = popBuffer(audioCtx, e);
  const start = base + e.t;
  const end = base + Math.max(e.t + e.attack, e.end);
  const release = e.mute ? 0.012 : 0.03;
  const s = Math.max(0, Math.min(5, e.s ?? 2));
  popVoice(audioCtx, buf, start, end, e.gain, e.attack, release, pop.pans[s], 1);
  if (e.dbl) {
    const cents = (s % 2 === 0 ? 1 : -1) * T.doubleCents;
    popVoice(
      audioCtx,
      buf,
      start + T.doubleDelay,
      end + T.doubleDelay,
      e.gain * T.doubleGain,
      e.attack,
      release,
      pop.pans[5 - s],
      Math.pow(2, cents / 1200)
    );
  }
}

/** Look-ahead scheduler so long progressions don't create thousands of nodes at once. */
function schedulePop(audioCtx, events, base, token) {
  let next = 0;
  const pump = () => {
    if (token !== playToken) return;
    const horizon = audioCtx.currentTime + 1.2;
    while (next < events.length && base + events[next].t < horizon) {
      playPopEvent(audioCtx, events[next], base);
      next += 1;
    }
    if (next >= events.length && scheduler) {
      window.clearInterval(scheduler);
      scheduler = null;
    }
  };
  pump();
  if (next < events.length) scheduler = window.setInterval(pump, 100);
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function stopAll() {
  playToken += 1;
  if (scheduler) {
    window.clearInterval(scheduler);
    scheduler = null;
  }
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

// ---- Classic plucked-string voice (blues shuffle) ----
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

// ---- Blues shuffle: classic boogie riff (root+5th / root+6th / root+b7) with swung eighths ----
const SHUFFLE_RIFF = [7, 7, 9, 9, 10, 10, 9, 9];

function shuffleBar(audioCtx, tones, start, barLen, last) {
  const root = guitarVoicing(tones)[0];
  const beatLen = barLen / 4;
  SHUFFLE_RIFF.forEach((interval, i) => {
    const beat = Math.floor(i / 2);
    const offbeat = i % 2 === 1;
    // Triplet swing: long-short, the off-beat lands on the third triplet.
    const t = start + beat * beatLen + (offbeat ? beatLen * (2 / 3) : 0);
    const len = offbeat ? beatLen / 3 : beatLen * (2 / 3);
    const isLast = last && i === SHUFFLE_RIFF.length - 1;
    const ring = isLast ? 1.6 : len * 0.92; // palm-muted, chugging feel
    const accent = offbeat ? 0.75 : beat % 2 === 0 ? 1.15 : 1.0;
    const level = 0.16 * accent;
    playString(audioCtx, midiToFreq(root), t, ring, level);
    playString(audioCtx, midiToFreq(root + interval), t + 0.008, ring, level * 0.9);
    playString(audioCtx, midiToFreq(root + 12), t + 0.016, ring, level * 0.5);
  });
}

export function stopPlayback() {
  stopAll();
}

export async function playChordTones(tones, chord) {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  stopAll();
  const c = chord && chord.tones ? chord : { tones };
  schedulePop(audioCtx, buildChordEvents(c), audioCtx.currentTime + 0.03, playToken);
}

/**
 * Play a progression.
 * style: "shuffle" (blues riff, classic voice) or a PLAY_STYLES id (pop acoustic voice).
 * beat: chord length in seconds, used by "shuffle" only; other styles use their own tempo.
 * tempoScale: speeds the playing styles up (e.g. for long progressions).
 */
export async function playProgression(
  chords,
  { beat = 2.0, style = DEFAULT_PLAY_STYLE, tempoScale = 1, onIndex, onEnd } = {}
) {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  stopAll();
  const token = playToken;
  const now = audioCtx.currentTime + 0.05;

  let starts;
  let totalSec;
  if (style === "shuffle") {
    chords.forEach((chord, i) => {
      shuffleBar(audioCtx, chord.tones, now + i * beat, beat, i === chords.length - 1);
    });
    starts = chords.map((_, i) => i * beat);
    totalSec = chords.length * beat;
  } else {
    const built = buildEvents(chords, style, { tempoScale, seed: (Math.random() * 1e9) | 0 });
    schedulePop(audioCtx, built.events, now, token);
    starts = built.chordStarts;
    totalSec = built.total;
  }

  starts.forEach((s, i) => {
    window.setTimeout(() => {
      if (token !== playToken) return;
      if (onIndex) onIndex(i);
    }, s * 1000 + 50);
  });

  window.setTimeout(() => {
    if (token !== playToken) return;
    if (onEnd) onEnd();
  }, totalSec * 1000 + 400);
}

export function isPlaying() {
  return active.length > 0;
}
