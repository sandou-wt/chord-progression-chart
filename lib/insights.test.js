import test from "node:test";
import assert from "node:assert/strict";
import { MAJOR_PROGRESSIONS, MINOR_PROGRESSIONS, BLUES_FORMS, chordFromNumeral, parseNote } from "./theory.js";
import { chordInfo } from "./chordInfo.js";
import { PROGRESSION_NOTES } from "./progressionNotes.js";
import {
  MELODIES,
  BLUES_MELODIES,
  parseMelody,
  barLengths,
  phraseNumerals,
  degreeToSemitones,
  melodyTonicMidi,
} from "./melodies.js";

const all = [
  ...MAJOR_PROGRESSIONS.map((p) => ({ ...p, mode: "major" })),
  ...MINOR_PROGRESSIONS.map((p) => ({ ...p, mode: "minor" })),
];
const blues = Object.values(BLUES_FORMS).map((f) => ({
  id: f.id,
  numerals: f.bars,
  mode: f.id.startsWith("minor") ? "minor" : "major",
}));

test("every numeral used on the site has a chord card", () => {
  for (const p of all) for (const n of p.numerals) assert.ok(chordInfo(n, p.mode), `${p.mode} ${n}`);
  for (const f of blues) for (const n of f.numerals) assert.ok(chordInfo(n, "blues"), `blues ${n}`);
});

test("every progression has a 150–300 word write-up", () => {
  for (const id of [...all.map((p) => p.id), "blues"]) {
    const note = PROGRESSION_NOTES[id];
    assert.ok(note, id);
    const words = note.why.join(" ").split(/\s+/).length;
    assert.ok(words >= 150 && words <= 300, `${id}: ${words} words`);
    assert.ok(Array.isArray(note.songs) && note.songs.length <= 8, id);
  }
});

function chordPcs(numeral, mode) {
  return chordFromNumeral("C", mode, numeral).tones.map((t) => parseNote(t).pc);
}

function soundingAt(notes, bar, pos) {
  return notes.find((n) => n.bar === bar && n.pos <= pos + 1e-9 && n.pos + n.dur > pos + 1e-9);
}

function checkMelody(m, numerals, mode, isBlues) {
  const chords = phraseNumerals(numerals, mode);
  assert.equal(m.bars.length, chords.length, `${m.id}: bar count`);
  barLengths(m.bars).forEach((len, i) => assert.equal(len, 4, `${m.id} bar ${i + 1} has ${len} beats`));
  const notes = parseMelody(m.bars);
  chords.forEach((num, bar) => {
    const allowed = new Set(chordPcs(num, mode));
    if (isBlues && /^I7$/.test(num)) allowed.add(3); // blue minor 3rd over I7
    for (const pos of [0, 2]) {
      const n = soundingAt(notes, bar, pos);
      if (!n) continue; // rest
      const pc = ((n.semi % 12) + 12) % 12;
      assert.ok(allowed.has(pc), `${m.id} bar ${bar + 1} beat ${pos + 1}: degree pc ${pc} not in ${num}`);
    }
  });
  const last = notes[notes.length - 1];
  assert.equal(((last.semi % 12) + 12) % 12, 0, `${m.id} must end on the tonic`);
  const semis = notes.map((n) => n.semi);
  assert.ok(Math.max(...semis) - Math.min(...semis) <= 17, `${m.id} range too wide`);
}

test("phrases: 4 beats per bar, chord tones on beats 1 and 3, end on tonic", () => {
  for (const p of all) {
    const list = MELODIES[p.id];
    assert.ok(list && list.length >= 2 && list.length <= 3, `${p.id} needs 2–3 phrases`);
    for (const m of list) checkMelody(m, p.numerals, p.mode, false);
  }
  for (const f of blues) {
    const list = BLUES_MELODIES[f.id];
    assert.ok(list && list.length >= 2, f.id);
    for (const m of list) checkMelody(m, f.numerals, f.mode, true);
  }
});

test("degree parsing", () => {
  assert.equal(degreeToSemitones("1"), 0);
  assert.equal(degreeToSemitones("b3"), 3);
  assert.equal(degreeToSemitones("5,"), -5);
  assert.equal(degreeToSemitones("2'"), 14);
  assert.equal(degreeToSemitones("b7,"), -2);
});

test("phrases transpose with the key", () => {
  const first = parseMelody(MELODIES["pop-axis"][0].bars)[0];
  const midiIn = (pc) => melodyTonicMidi(pc) + first.semi;
  assert.equal(midiIn(0), 64); // C major: E4
  assert.equal(midiIn(7), 59); // G major: B3
  assert.equal(midiIn(9), 61); // A major: C♯4
  assert.equal(midiIn(9) - midiIn(7), 2); // same shape, moved up a whole step
});

test("phrase chords add a final tonic bar when needed", () => {
  assert.deepEqual(phraseNumerals(["I", "V", "vi", "IV"], "major"), ["I", "V", "vi", "IV", "I"]);
  assert.deepEqual(phraseNumerals(["vi", "ii", "V", "I"], "major"), ["vi", "ii", "V", "I"]);
  assert.deepEqual(phraseNumerals(["i", "VII", "VI", "V"], "minor"), ["i", "VII", "VI", "V", "i"]);
  assert.equal(phraseNumerals(BLUES_FORMS.standard.bars, "major").at(-1), "I7");
  assert.equal(phraseNumerals(BLUES_FORMS["minor-standard"].bars, "minor").at(-1), "i7");
});
