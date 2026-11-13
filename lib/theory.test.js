import test from "node:test";
import assert from "node:assert/strict";
import {
  progressionChords,
  chordFromNumeral,
  transposeKey,
  bluesBars,
  diatonicChords,
  scaleNotes,
  formatChord,
} from "./theory.js";

function names(tonic, mode, numerals) {
  return progressionChords(tonic, mode, numerals).map((c) => c.name);
}

test("C major I–V–vi–IV is C–G–Am–F", () => {
  assert.deepEqual(names("C", "major", ["I", "V", "vi", "IV"]), ["C", "G", "Am", "F"]);
});

test("G major I–V–vi–IV is G–D–Em–C", () => {
  assert.deepEqual(names("G", "major", ["I", "V", "vi", "IV"]), ["G", "D", "Em", "C"]);
});

test("F major I–V–vi–IV is F–C–Dm–B♭", () => {
  assert.deepEqual(names("F", "major", ["I", "V", "vi", "IV"]), ["F", "C", "Dm", "B♭"]);
});

test("D♭ major I–V–vi–IV is D♭–A♭–B♭m–G♭", () => {
  assert.deepEqual(names("D♭", "major", ["I", "V", "vi", "IV"]), ["D♭", "A♭", "B♭m", "G♭"]);
});

test("F♯ major I–V–vi–IV is F♯–C♯–D♯m–B and vii° is E♯°", () => {
  assert.deepEqual(names("F♯", "major", ["I", "V", "vi", "IV"]), ["F♯", "C♯", "D♯m", "B"]);
  assert.equal(chordFromNumeral("F♯", "major", "vii°").name, "E♯°");
});

test("C major ii7–V7–Imaj7 is Dm7–G7–Cmaj7", () => {
  assert.deepEqual(names("C", "major", ["ii7", "V7", "Imaj7"]), ["Dm7", "G7", "Cmaj7"]);
});

test("C major full circle of fifths", () => {
  assert.deepEqual(
    names("C", "major", ["I", "IV", "vii°", "iii", "vi", "ii", "V", "I"]),
    ["C", "F", "B°", "Em", "Am", "Dm", "G", "C"]
  );
});

test("A minor i–VI–III–VII is Am–F–C–G", () => {
  assert.deepEqual(names("A", "minor", ["i", "VI", "III", "VII"]), ["Am", "F", "C", "G"]);
});

test("A minor Andalusian i–VII–VI–V is Am–G–F–E", () => {
  assert.deepEqual(names("A", "minor", ["i", "VII", "VI", "V"]), ["Am", "G", "F", "E"]);
});

test("C minor i–iv–V is Cm–Fm–G", () => {
  assert.deepEqual(names("C", "minor", ["i", "iv", "V"]), ["Cm", "Fm", "G"]);
});

test("E♭ minor epic i–VI–III–VII uses G♭–C♭–D♭", () => {
  assert.deepEqual(names("E♭", "minor", ["i", "VI", "III", "VII"]), ["E♭m", "C♭", "G♭", "D♭"]);
});

test("transpose C major up two semitones is D; I–V–vi–IV becomes D–A–Bm–G", () => {
  const d = transposeKey("C", "major", 2);
  assert.equal(d, "D");
  assert.deepEqual(names(d, "major", ["I", "V", "vi", "IV"]), ["D", "A", "Bm", "G"]);
});

test("transpose C major to A (down 3 / up 9)", () => {
  const a = transposeKey("C", "major", 9);
  assert.equal(a, "A");
  assert.deepEqual(names(a, "major", ["I", "V", "vi", "IV"]), ["A", "E", "F♯m", "D"]);
});

test("transpose A minor up 2 semitones is B minor: Bm–G–D–A", () => {
  const b = transposeKey("A", "minor", 2);
  assert.equal(b, "B");
  assert.deepEqual(names(b, "minor", ["i", "VI", "III", "VII"]), ["Bm", "G", "D", "A"]);
});

test("12-bar blues in E (standard)", () => {
  const bars = bluesBars("E", "standard").map((c) => c.name);
  assert.deepEqual(bars, ["E7", "E7", "E7", "E7", "A7", "A7", "E7", "E7", "B7", "A7", "E7", "B7"]);
});

test("quick-change blues in C starts I7–IV7", () => {
  const bars = bluesBars("C", "quick-change").map((c) => c.name);
  assert.deepEqual(bars.slice(0, 4), ["C7", "F7", "C7", "C7"]);
});

test("D♭7 is spelled with C♭, not B", () => {
  const chord = chordFromNumeral("D♭", "major", "I7");
  assert.equal(chord.name, "D♭7");
  assert.deepEqual(chord.tones, ["D♭", "F", "A♭", "C♭"]);
});

test("diatonic chords in C major", () => {
  assert.deepEqual(
    diatonicChords("C", "major").map((c) => c.name),
    ["C", "Dm", "Em", "F", "G", "Am", "B°"]
  );
});

test("diatonic chords in A minor (natural)", () => {
  assert.deepEqual(
    diatonicChords("A", "minor").map((c) => c.name),
    ["Am", "B°", "C", "Dm", "Em", "F", "G"]
  );
});

test("F♯ major scale uses E♯, not F", () => {
  assert.deepEqual(scaleNotes("F♯", "major"), ["F♯", "G♯", "A♯", "B", "C♯", "D♯", "E♯"]);
});

test("formatChord suffixes", () => {
  assert.equal(formatChord("C", "major"), "C");
  assert.equal(formatChord("A", "minor"), "Am");
  assert.equal(formatChord("B", "diminished"), "B°");
  assert.equal(formatChord("G", "dominant7"), "G7");
});
