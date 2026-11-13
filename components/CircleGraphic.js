"use client";

import { MAJOR_KEYS, MINOR_KEYS, displayKey } from "@/lib/theory";

const CX = 160;
const CY = 160;
const R = 118;

function pos(index, total, radius = R) {
  const angle = (Math.PI / 2) * -1 + (index / total) * 2 * Math.PI;
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

export default function CircleGraphic({ tonic, mode, onSelect }) {
  const keys = mode === "minor" ? MINOR_KEYS : MAJOR_KEYS;
  const relatives = mode === "minor" ? MAJOR_KEYS : MINOR_KEYS;

  return (
    <svg className="circle-svg" viewBox="0 0 320 320" role="img" aria-label="Circle of fifths">
      <circle cx={CX} cy={CY} r="148" fill="#fffdf8" stroke="#d4cbbd" />
      {keys.map((k, i) => {
        const p = pos(i, 12, 118);
        const active = k === tonic;
        return (
          <g
            key={k}
            style={{ cursor: "pointer" }}
            onClick={() => onSelect && onSelect(k)}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r="22"
              className={`wedge ${active ? "is-active" : ""}`}
              fill={active ? "#fde8c8" : "#fff"}
              stroke={active ? "#9a3412" : "#d4cbbd"}
            />
            <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle">
              {displayKey(k, mode)}
            </text>
            <text
              className="label-minor"
              x={p.x}
              y={p.y + 32}
              textAnchor="middle"
            >
              {mode === "minor"
                ? relatives[i]
                : displayKey(relatives[i], "minor")}
            </text>
          </g>
        );
      })}
      <circle className="hub" cx={CX} cy={CY} r="28" />
      <text className="hub-text" x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle">
        {displayKey(tonic, mode)}
      </text>
    </svg>
  );
}

