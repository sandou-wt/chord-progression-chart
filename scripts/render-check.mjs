// Offline level check for the guitar engine (no Web Audio needed).
// node scripts/render-check.mjs [--wav]
import { writeFileSync } from "node:fs";
import { buildEvents, buildChordEvents, synthPluck, midiToFreq, PLAY_STYLES, POP_TONE } from "../lib/guitar.js";
import { progressionChords } from "../lib/theory.js";

const RATE = 44100;
const cache = new Map();
function pluck(e) {
  const key = `${e.midi}|${e.mute ? 1 : 0}|${Math.round(e.bright * 20)}`;
  if (!cache.has(key)) cache.set(key, synthPluck(RATE, midiToFreq(e.midi), { bright: e.bright, mute: e.mute }));
  return cache.get(key);
}

function biquad(type, f0, q, gainDb) {
  const A = Math.pow(10, gainDb / 40), w = (2 * Math.PI * f0) / RATE, c = Math.cos(w), s = Math.sin(w);
  let b0, b1, b2, a0, a1, a2;
  if (type === "highpass" || type === "lowpass") {
    const al = s / (2 * q);
    if (type === "highpass") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; } else { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    a0 = 1 + al; a1 = -2 * c; a2 = 1 - al;
  } else if (type === "peaking") {
    const al = s / (2 * q);
    b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * c; a2 = 1 - al / A;
  } else { // highshelf, S=1
    const al = (s / 2) * Math.sqrt(2), sq = 2 * Math.sqrt(A) * al;
    b0 = A * (A + 1 + (A - 1) * c + sq); b1 = -2 * A * (A - 1 + (A + 1) * c); b2 = A * (A + 1 + (A - 1) * c - sq);
    a0 = A + 1 - (A - 1) * c + sq; a1 = 2 * (A - 1 - (A + 1) * c); a2 = A + 1 - (A - 1) * c - sq;
  }
  return (x) => {
    const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  };
}

function render(events, total) {
  const len = Math.ceil((total + 1.5) * RATE);
  const L = new Float32Array(len), R = new Float32Array(len);
  const place = (buf, start, gainEnv, pan, rate) => {
    const x = (pan + 1) / 2, gl = Math.cos((x * Math.PI) / 2), gr = Math.sin((x * Math.PI) / 2);
    const s0 = Math.round(start * RATE);
    for (let i = 0; s0 + i < len; i++) {
      const pos = i * rate; const k = Math.floor(pos); if (k + 1 >= buf.length) break;
      const g = gainEnv(i / RATE); if (g < 1e-5 && i > RATE * 0.05) break;
      const v = (buf[k] + (buf[k + 1] - buf[k]) * (pos - k)) * g;
      L[s0 + i] += v * gl; R[s0 + i] += v * gr;
    }
  };
  for (const e of events) {
    const buf = pluck(e);
    const dur = e.end - e.t, tc = e.mute ? 0.012 : 0.03;
    const env = (lvl) => (t) => t < e.attack ? (lvl * t) / e.attack : t < dur ? lvl : lvl * Math.exp(-(t - dur) / tc);
    place(buf, e.t, env(e.gain), POP_TONE.pans[e.s] ?? 0, 1);
    if (e.dbl) {
      const cents = (e.s % 2 === 0 ? 1 : -1) * POP_TONE.doubleCents;
      place(buf, e.t + POP_TONE.doubleDelay, env(e.gain * POP_TONE.doubleGain), POP_TONE.pans[5 - e.s] ?? 0, Math.pow(2, cents / 1200));
    }
  }
  const chain = [
    biquad("highpass", POP_TONE.highpass, 0.7, 0),
    biquad("peaking", POP_TONE.mud.freq, POP_TONE.mud.q, POP_TONE.mud.gain),
    biquad("peaking", POP_TONE.presence.freq, POP_TONE.presence.q, POP_TONE.presence.gain),
    biquad("highshelf", POP_TONE.air.freq, 0, POP_TONE.air.gain),
    biquad("lowpass", POP_TONE.lowpass, 0.7, 0),
  ];
  let l = L, r = R;
  for (const f of chain) { l = f(l); r = f(r); }
  // Crude reverb stand-in (comb bank) at the same wet level, for headroom only.
  const verb = (x) => {
    const y = new Float32Array(x.length);
    for (const [d, fb] of [[1557, 0.8], [1617, 0.79], [1491, 0.8], [1422, 0.78]]) {
      const b = new Float32Array(x.length);
      for (let i = 0; i < x.length; i++) b[i] = x[i] + (i >= d ? fb * b[i - d] : 0);
      for (let i = 0; i < x.length; i++) y[i] += b[i] * 0.06;
    }
    return y;
  };
  const vl = verb(l), vr = verb(r);
  for (let i = 0; i < len; i++) { const G = POP_TONE.inputGain; l[i] = G * (l[i] * POP_TONE.dry + vl[i] * POP_TONE.wet); r[i] = G * (r[i] * POP_TONE.dry + vr[i] * POP_TONE.wet); }
  return [l, r];
}

function stats([l, r], total) {
  let peak = 0, sum = 0, n = 0, maxWin = 0, jump = 0;
  const win = Math.floor(RATE * 0.3);
  let wsum = 0;
  const end = Math.floor(total * RATE);
  for (let i = 0; i < l.length; i++) {
    peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
    const e = (l[i] * l[i] + r[i] * r[i]) / 2;
    if (i < end) { sum += e; n++; }
    wsum += e; if (i >= win) wsum -= (l[i - win] ** 2 + r[i - win] ** 2) / 2;
    maxWin = Math.max(maxWin, wsum / win);
    if (i > 0) jump = Math.max(jump, Math.abs(l[i] - l[i - 1]));
  }
  const db = (x) => (20 * Math.log10(x)).toFixed(1);
  return { peak: peak.toFixed(3), peakDb: db(peak), rmsDb: db(Math.sqrt(sum / n)), maxRms300msDb: db(Math.sqrt(maxWin)), maxStep: jump.toFixed(3) };
}

function wav(name, [l, r]) {
  const n = l.length, b = Buffer.alloc(44 + n * 4);
  b.write("RIFF", 0); b.writeUInt32LE(36 + n * 4, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 4, 28);
  b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(l[i] * 32767))), 44 + i * 4);
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(r[i] * 32767))), 46 + i * 4);
  }
  writeFileSync(name, b);
}

const tests = [
  ["C I-V-vi-IV", progressionChords("C", "major", ["I", "V", "vi", "IV"])],
  ["E I-V-vi-IV", progressionChords("E", "major", ["I", "V", "vi", "IV"])],
  ["A minor circle", progressionChords("A", "minor", ["i", "iv", "VII", "III", "VI", "ii°", "V", "i"])],
];
const doWav = process.argv.includes("--wav");
for (const [name, chords] of tests) {
  for (const st of PLAY_STYLES) {
    const { events, total } = buildEvents(chords, st.id, { tempoScale: chords.length > 6 ? 1.15 : 1 });
    const out = render(events, total);
    console.log(name.padEnd(16), st.id.padEnd(11), `${total.toFixed(1)}s`, JSON.stringify(stats(out, total - 3.2)));
    if (doWav && name.startsWith("C")) wav(`/tmp/render-${st.id}.wav`, out);
  }
}
const one = buildChordEvents(progressionChords("C", "major", ["I"])[0]);
console.log("single chord C", JSON.stringify(stats(render(one, 2.6), 2.6)));
