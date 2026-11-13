"use client";

import { useMemo, useState } from "react";
import { MAJOR_KEYS, MINOR_KEYS, displayKey, transposeKey, bluesBars, BLUES_FORMS } from "@/lib/theory";
import { playChordTones, playProgression, stopPlayback } from "@/lib/audio";

export default function BluesTool({ defaultForm = "standard" }) {
  const [formId, setFormId] = useState(defaultForm);
  const isMinor = formId.startsWith("minor");
  const keys = isMinor ? MINOR_KEYS : MAJOR_KEYS;
  const [tonic, setTonic] = useState(isMinor ? "A" : "C");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const bars = useMemo(() => bluesBars(tonic, formId), [tonic, formId]);

  function stop() {
    stopPlayback();
    setPlaying(false);
    setActiveIndex(-1);
  }

  function onForm(next) {
    stop();
    const nextMinor = next.startsWith("minor");
    if (nextMinor !== isMinor) {
      setTonic(nextMinor ? "A" : "C");
    }
    setFormId(next);
  }

  function onTonic(next) {
    stop();
    setTonic(next);
  }

  function transpose(semitones) {
    onTonic(transposeKey(tonic, isMinor ? "minor" : "major", semitones));
  }

  async function playCurrent() {
    stopPlayback();
    setPlaying(true);
    setActiveIndex(0);
    await playProgression(bars, {
      beat: 1.6,
      onIndex: setActiveIndex,
      onEnd: () => {
        setPlaying(false);
        setActiveIndex(-1);
      },
    });
  }

  async function playOne(chord, i) {
    stopPlayback();
    setPlaying(false);
    setActiveIndex(i);
    await playChordTones(chord.tones);
  }

  const uniqueNumerals = [...new Set(BLUES_FORMS[formId].bars)];

  return (
    <div className="tool" id="tool">
      <div className="controls">
        <div className="field">
          <label htmlFor="blues-key">Key</label>
          <select id="blues-key" value={tonic} onChange={(e) => onTonic(e.target.value)}>
            {keys.map((k) => (
              <option key={k} value={k}>
                {displayKey(k, isMinor ? "minor" : "major")}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="blues-form">Form</label>
          <select id="blues-form" value={formId} onChange={(e) => onForm(e.target.value)}>
            <option value="standard">Standard 12-bar</option>
            <option value="quick-change">Quick-change</option>
            <option value="minor-standard">Minor 12-bar</option>
          </select>
        </div>
      </div>

      <div className="key-strip">
        {uniqueNumerals.map((n) => {
          const chord = bars.find((b) => b.numeral === n);
          return (
            <span key={n}>
              <span>{n}</span> <strong>{chord?.name}</strong>
            </span>
          );
        })}
      </div>

      <p className="now-label" style={{ margin: "0 0 0.35rem" }}>
        {BLUES_FORMS[formId].name} in {displayKey(tonic, isMinor ? "minor" : "major")} — 12 bars
      </p>
      <div className="blues-grid" role="list">
        {bars.map((c, i) => (
          <button
            key={`${c.name}-${i}`}
            type="button"
            className={`bar ${activeIndex === i ? "is-active" : ""}`}
            onClick={() => playOne(c, i)}
          >
            <span className="bar-num">Bar {i + 1}</span>
            <span className="n">{c.numeral}</span>
            <span className="c">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="button-row no-print">
        <button type="button" onClick={playing ? stop : playCurrent}>
          {playing ? "Stop" : "Play 12-bar progression"}
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
    </div>
  );
}
