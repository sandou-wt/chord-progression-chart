/**
 * Lightweight Web Audio playback for triads and seventh chords.
 * No samples, no network. Must be started from a user gesture.
 */

import { chordToMidi } from "./theory.js";

let ctx = null;
let active = [];
let playToken = 0;

function getCtx() {
  if (!ctx || ctx.state === "closed") {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function stopAll() {
  playToken += 1;
  for (const node of active) {
    try {
      node.stop();
    } catch {
      /* already stopped */
    }
  }
  active = [];
}

function playTone(audioCtx, freq, start, duration, gainValue) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(freq, start);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2, start);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, start);

  const peak = gainValue;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(peak * 0.55, start + duration * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc1.start(start);
  osc2.start(start);
  osc1.stop(start + duration + 0.02);
  osc2.stop(start + duration + 0.02);
  active.push(osc1, osc2);
}

export function stopPlayback() {
  stopAll();
}

export async function playChordTones(tones, { duration = 1.1 } = {}) {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  stopAll();
  const now = audioCtx.currentTime + 0.02;
  const midis = chordToMidi(tones);
  midis.forEach((midi, i) => {
    const start = now + i * 0.018;
    const isBass = i === 0;
    playTone(audioCtx, midiToFreq(midi), start, duration, isBass ? 0.11 : 0.07);
  });
}

export async function playProgression(chords, { beat = 0.7, onIndex, onEnd } = {}) {
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") await audioCtx.resume();
  stopAll();
  const token = playToken;
  const now = audioCtx.currentTime + 0.03;

  chords.forEach((chord, i) => {
    const start = now + i * beat;
    const midis = chordToMidi(chord.tones);
    midis.forEach((midi, n) => {
      const isBass = n === 0;
      playTone(
        audioCtx,
        midiToFreq(midi),
        start + n * 0.012,
        beat * 0.92,
        isBass ? 0.11 : 0.065
      );
    });
  });

  chords.forEach((_, i) => {
    const delay = i * beat * 1000;
    window.setTimeout(() => {
      if (token !== playToken) return;
      if (onIndex) onIndex(i);
    }, delay);
  });

  const total = chords.length * beat * 1000 + 40;
  window.setTimeout(() => {
    if (token !== playToken) return;
    if (onEnd) onEnd();
  }, total);
}

export function isPlaying() {
  return active.length > 0;
}
