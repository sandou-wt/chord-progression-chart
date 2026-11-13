"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  keysFor,
  progressionsFor,
  progressionChords,
  diatonicChords,
  displayKey,
  transposeKey,
} from "@/lib/theory";
import {
  playChordTones,
  playProgression,
  stopPlayback,
  PLAY_STYLES,
  DEFAULT_PLAY_STYLE,
  guitarReady,
} from "@/lib/audio";

const PLAY_STYLE_KEY = "cpc-play-style";
import CircleGraphic from "./CircleGraphic";
import TheoryPanel from "./TheoryPanel";
import { MELODIES } from "@/lib/melodies";

function qualityClass(quality) {
  if (quality === "minor" || quality === "m7" || quality === "halfdim7") return "q-minor";
  if (quality === "diminished" || quality === "dim7") return "q-dim";
  return "q-major";
}

export default function ProgressionTool({
  defaultMode = "major",
  defaultTonic,
  defaultStyleId,
  allowedIds,
  hideModeToggle = false,
  showCircle = false,
}) {
  const initialKeys = keysFor(defaultMode);
  const [mode, setMode] = useState(defaultMode);
  const [tonic, setTonic] = useState(defaultTonic || initialKeys[0]);
  const [styleId, setStyleId] = useState(defaultStyleId || null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [playStyle, setPlayStyle] = useState(DEFAULT_PLAY_STYLE);
  const [loading, setLoading] = useState(false);
  const lastPlayed = useRef(null);

  useEffect(() => {
    const reset = () => {
      setPlaying(false);
      setActiveIndex(-1);
      setLoading(false);
    };
    window.addEventListener("cpc-audio-stop", reset);
    return () => window.removeEventListener("cpc-audio-stop", reset);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PLAY_STYLE_KEY);
      if (saved && PLAY_STYLES.some((p) => p.id === saved)) setPlayStyle(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const allStyles = progressionsFor(mode);
  const styles = allowedIds ? allStyles.filter((p) => allowedIds.includes(p.id)) : allStyles;
  const selected = styles.find((p) => p.id === styleId) || styles[0];

  const chords = useMemo(
    () => (selected ? progressionChords(tonic, mode, selected.numerals) : []),
    [tonic, mode, selected]
  );
  const diatonic = useMemo(() => diatonicChords(tonic, mode), [tonic, mode]);
  const keys = keysFor(mode);

  function stop() {
    stopPlayback();
    setPlaying(false);
    setActiveIndex(-1);
  }

  function onMode(next) {
    stop();
    const pcList = keysFor(next);
    const currentPc = keysFor(mode);
    const idx = currentPc.indexOf(tonic);
    // Prefer the same list index (circle-of-fifths neighbor), but if the
    // tonic exists in the new mode (parallel key), keep the tonic letter.
    const parallel = pcList.find((k) => k === tonic) || pcList[Math.max(0, idx)] || pcList[0];
    setMode(next);
    setTonic(parallel);
    const nextStyles = allowedIds
      ? progressionsFor(next).filter((p) => allowedIds.includes(p.id))
      : progressionsFor(next);
    setStyleId(nextStyles[0]?.id || null);
  }

  function onTonic(next) {
    stop();
    setTonic(next);
  }

  function transpose(semitones) {
    onTonic(transposeKey(tonic, mode, semitones));
  }

  async function startPlayback(list, style = playStyle) {
    lastPlayed.current = list;
    // playProgression stops any other playback synchronously (firing the stop
    // event), so set our own "playing" state after calling it.
    const promise = playProgression(list, {
      style,
      tempoScale: list.length > 6 ? 1.15 : 1,
      onIndex: setActiveIndex,
      onEnd: () => {
        setPlaying(false);
        setActiveIndex(-1);
      },
    });
    setPlaying(true);
    setActiveIndex(0);
    if (!guitarReady()) setLoading(true);
    try {
      await promise;
    } catch {
      setPlaying(false);
      setActiveIndex(-1);
    } finally {
      setLoading(false);
    }
  }

  function playCurrent() {
    return startPlayback(chords);
  }

  function onPlayStyle(next) {
    setPlayStyle(next);
    try {
      window.localStorage.setItem(PLAY_STYLE_KEY, next);
    } catch {
      /* storage unavailable */
    }
    if (playing && lastPlayed.current) startPlayback(lastPlayed.current, next);
  }

  async function playOne(chord, i) {
    const promise = playChordTones(chord.tones, chord);
    setActiveIndex(i);
    if (!guitarReady()) setLoading(true);
    try {
      await promise;
    } catch {
      /* samples failed to load */
    } finally {
      setLoading(false);
    }
  }

  async function playRow(p) {
    const rowChords = progressionChords(tonic, mode, p.numerals);
    setStyleId(p.id);
    await startPlayback(rowChords);
  }

  return (
    <div className="tool" id="tool">
      {showCircle && (
        <div className="circle-wrap">
          <CircleGraphic tonic={tonic} mode={mode} onSelect={onTonic} />
          <p style={{ margin: 0, color: "var(--muted)" }}>
            The circle of fifths. Each step clockwise is up a fifth (C to G to D).
            Click a key to transpose the progression. The inner name is the current
            key; the small label is its relative {mode === "minor" ? "major" : "minor"}.
          </p>
        </div>
      )}
      <div className="controls">
        <div className="field">
          <label htmlFor="key-select">Key</label>
          <select
            id="key-select"
            value={tonic}
            onChange={(e) => onTonic(e.target.value)}
          >
            {keys.map((k) => (
              <option key={k} value={k}>
                {displayKey(k, mode)}
              </option>
            ))}
          </select>
        </div>
        {!hideModeToggle && (
          <div className="field">
            <label htmlFor="mode-select">Major / minor</label>
            <select
              id="mode-select"
              value={mode}
              onChange={(e) => onMode(e.target.value)}
            >
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="style-select">Style</label>
          <select
            id="style-select"
            value={selected?.id || ""}
            onChange={(e) => {
              stop();
              setStyleId(e.target.value);
            }}
          >
            {styles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="key-strip" aria-label="Chords in this key">
        {diatonic.map((c) => (
          <span key={c.numeral}>
            <span>{c.numeral}</span> <strong>{c.name}</strong>
          </span>
        ))}
      </div>

      <div className="now-playing">
        <p className="now-label">
          {selected?.name} in {displayKey(tonic, mode)}
        </p>
        <div className="chord-row" role="list">
          {chords.map((c, i) => (
            <button
              key={`${c.name}-${i}`}
              type="button"
              className={`chord-chip ${qualityClass(c.quality)} ${
                activeIndex === i ? "is-active" : ""
              }`}
              onClick={() => playOne(c, i)}
              title={`Play ${c.name}`}
            >
              <span className="numeral">{c.numeral}</span>
              <span className="name">{c.name}</span>
            </button>
          ))}
        </div>
        {selected?.blurb && (
          <p style={{ margin: "0.7rem 0 0", color: "var(--muted)", fontSize: "0.95rem" }}>
            {selected.blurb}
          </p>
        )}
      </div>

      <div className="play-styles no-print" role="group" aria-labelledby="play-style-label">
        <span id="play-style-label" className="play-styles-label">
          Playing style
        </span>
        <div className="play-styles-options">
          {PLAY_STYLES.map((ps) => (
            <button
              key={ps.id}
              type="button"
              className={`play-style ${playStyle === ps.id ? "is-on" : ""}`}
              aria-pressed={playStyle === ps.id}
              title={ps.hint}
              onClick={() => onPlayStyle(ps.id)}
            >
              {ps.label}
            </button>
          ))}
        </div>
      </div>

      <div className="button-row no-print">
        <button type="button" onClick={playing ? stop : playCurrent}>
          {loading ? "Loading guitar…" : playing ? "Stop" : "Play progression"}
        </button>
        <button type="button" className="secondary" onClick={() => transpose(-1)}>
          Transpose down
        </button>
        <button type="button" className="secondary" onClick={() => transpose(1)}>
          Transpose up
        </button>
        <button type="button" className="secondary" onClick={() => window.print()}>
          Print chart
        </button>
      </div>

      {selected && (
        <TheoryPanel
          context={mode}
          mode={mode}
          tonic={tonic}
          numerals={selected.numerals}
          notesId={selected.id}
          melodies={MELODIES[selected.id]}
          activeIndex={activeIndex}
          onChordClick={(chord, i) => playOne(chord, i)}
        />
      )}

      <h2 style={{ marginTop: "1.5rem" }}>Common chord progressions in this key</h2>
      <div className="table-wrap">
        <table className="chart">
          <thead>
            <tr>
              <th scope="col">Progression</th>
              <th scope="col">Roman numerals</th>
              <th scope="col">Chords in {displayKey(tonic, mode)}</th>
              <th scope="col" className="no-print">
                Listen
              </th>
            </tr>
          </thead>
          <tbody>
            {styles.map((p) => {
              const row = progressionChords(tonic, mode, p.numerals);
              const isSel = p.id === selected?.id;
              return (
                <tr key={p.id} className={isSel ? "is-selected" : ""}>
                  <th scope="row">{p.name}</th>
                  <td>{p.numerals.join(" – ")}</td>
                  <td className="chords">{row.map((c) => c.name).join(" – ")}</td>
                  <td className="no-print">
                    <button type="button" className="row-play" onClick={() => playRow(p)}>
                      Play
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
