"use client";

import { useEffect, useMemo, useState } from "react";
import { chordFromNumeral, scaleNotes, parseNote, formatNote, tonicPc } from "@/lib/theory";
import { chordInfo } from "@/lib/chordInfo";
import { PROGRESSION_NOTES, SONG_DISCLAIMER } from "@/lib/progressionNotes";
import { parseMelody, phraseNumerals, melodyTonicMidi, PHRASE_LABEL } from "@/lib/melodies";
import { playPhrase, playChordTones, stopPlayback, leadReady, guitarReady } from "@/lib/audio";

/** Spell a melody degree (e.g. "b3", "5,") as a note name in the given key. */
function spellDegree(tonic, token) {
  const m = token.match(/^([b#]*)([1-7])/);
  const base = scaleNotes(tonic, "major")[Number(m[2]) - 1];
  const { letter, acc } = parseNote(base);
  let shift = 0;
  for (const ch of m[1]) shift += ch === "b" ? -1 : 1;
  return formatNote(letter, acc + shift);
}

function phraseText(tonic, bars) {
  return bars
    .map((bar) =>
      bar
        .trim()
        .split(/\s+/)
        .map((tok) => tok.split(":")[0])
        .filter((d) => d !== "-")
        .map((d) => spellDegree(tonic, d))
        .join(" ")
    )
    .join("  |  ");
}

export default function TheoryPanel({
  context, // "major" | "minor" | "blues"
  mode,
  tonic,
  numerals, // chords in order, as played by the main player
  notesId,
  melodies,
  phraseStyle = "fingerpick",
  activeIndex = -1,
  uniqueCards = false,
  onChordClick,
}) {
  const [phraseId, setPhraseId] = useState(null);
  const [phraseLoading, setPhraseLoading] = useState(false);
  const [phraseBar, setPhraseBar] = useState(-1);

  useEffect(() => {
    const reset = () => {
      setPhraseId(null);
      setPhraseBar(-1);
      setPhraseLoading(false);
    };
    window.addEventListener("cpc-audio-stop", reset);
    return () => window.removeEventListener("cpc-audio-stop", reset);
  }, []);

  const notes = PROGRESSION_NOTES[notesId];
  const chords = useMemo(() => numerals.map((n) => chordFromNumeral(tonic, mode, n)), [numerals, tonic, mode]);
  const pNumerals = useMemo(() => phraseNumerals(numerals, mode), [numerals, mode]);
  const phraseChords = useMemo(
    () => pNumerals.map((n) => chordFromNumeral(tonic, mode, n)),
    [pNumerals, tonic, mode]
  );

  const cards = uniqueCards
    ? [...new Set(numerals)].map((n) => ({ numeral: n, index: numerals.indexOf(n) }))
    : numerals.map((n, i) => ({ numeral: n, index: i }));

  // Which card is sounding right now (main player or a phrase)?
  let activeCard = -1;
  let activeNum = null;
  if (phraseBar >= 0) {
    if (phraseBar < numerals.length) activeCard = phraseBar;
    else activeNum = pNumerals[phraseBar];
  } else if (activeIndex >= 0) activeCard = activeIndex;
  const curNum = activeNum ?? (activeCard >= 0 ? numerals[activeCard] : null);
  const isActive = (card) =>
    uniqueCards
      ? card.numeral === curNum
      : activeCard >= 0
        ? card.index === activeCard
        : activeNum != null && card.index === numerals.indexOf(activeNum);

  async function startPhrase(m) {
    if (phraseId === m.id) {
      stopPlayback();
      return;
    }
    const promise = playPhrase(phraseChords, parseMelody(m.bars), {
      tonicMidi: melodyTonicMidi(tonicPc(tonic)),
      style: phraseStyle,
      onIndex: setPhraseBar,
      onEnd: () => {
        setPhraseId(null);
        setPhraseBar(-1);
      },
    });
    setPhraseId(m.id);
    setPhraseBar(0);
    if (!leadReady() || !guitarReady()) setPhraseLoading(true);
    try {
      await promise;
    } catch {
      setPhraseId(null);
      setPhraseBar(-1);
    } finally {
      setPhraseLoading(false);
    }
  }

  async function clickCard(card) {
    if (onChordClick) return onChordClick(chords[card.index], card.index);
    await playChordTones(chords[card.index].tones, chords[card.index]);
  }

  return (
    <div className="theory">
      <section className="theory-block" aria-labelledby="chord-roles">
        <h2 id="chord-roles">What each chord does</h2>
        <p className="theory-hint">Click a card to hear the chord. Colour words describe how a chord often feels, not a rule.</p>
        <div className="chord-cards">
          {cards.map((card) => {
            const info = chordInfo(card.numeral, context);
            const chord = chords[card.index];
            return (
              <button
                key={`${card.numeral}-${card.index}`}
                type="button"
                className={`chord-card fn-${info?.group || "colour"} ${isActive(card) ? "is-active" : ""}`}
                onClick={() => clickCard(card)}
                title={`Play ${chord.name}`}
              >
                <span className="cc-top">
                  <span className="cc-numeral">{card.numeral}</span>
                  <span className="cc-name">{chord.name}</span>
                </span>
                <span className="cc-fn">{info?.fn}</span>
                <span className="cc-tag">Often feels: {info?.tag}</span>
                <span className="cc-note">{info?.note}</span>
              </button>
            );
          })}
        </div>
      </section>

      {notes && (
        <section className="theory-block prose" aria-labelledby="why-good">
          <h2 id="why-good">Why it sounds good</h2>
          {notes.why.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </section>
      )}

      {notes && notes.songs.length > 0 && (
        <section className="theory-block" aria-labelledby="songs">
          <h2 id="songs">Famous songs that use it</h2>
          <div className="table-wrap">
            <table className="chart songs">
              <thead>
                <tr>
                  <th scope="col">Song</th>
                  <th scope="col">Artist</th>
                  <th scope="col">Section</th>
                  <th scope="col">Key</th>
                </tr>
              </thead>
              <tbody>
                {notes.songs.map((s) => (
                  <tr key={s.song + s.artist}>
                    <th scope="row">{s.song}</th>
                    <td>{s.artist}</td>
                    <td>{s.section}</td>
                    <td>{s.key || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="theory-hint">{SONG_DISCLAIMER}</p>
        </section>
      )}

      {melodies && melodies.length > 0 && (
        <section className="theory-block" aria-labelledby="phrases">
          <h2 id="phrases">Melodic phrases to play over it</h2>
          <p className="theory-hint">{PHRASE_LABEL} They follow the key you pick above.</p>
          <div className="phrases">
            {melodies.map((m) => (
              <div key={m.id} className={`phrase ${phraseId === m.id ? "is-playing" : ""}`}>
                <div className="phrase-head">
                  <h3>{m.title}</h3>
                  <button type="button" className="secondary no-print" onClick={() => startPhrase(m)}>
                    {phraseId === m.id ? (phraseLoading ? "Loading…" : "Stop") : "Play phrase"}
                  </button>
                </div>
                <p className="phrase-notes">{phraseText(tonic, m.bars)}</p>
                <p className="phrase-why">{m.why}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
