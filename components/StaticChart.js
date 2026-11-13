import { chartMatrix, progressionsFor } from "@/lib/theory";

export default function StaticChart({ mode, caption }) {
  const progressions = progressionsFor(mode);
  const matrix = chartMatrix(mode, progressions);
  const title =
    mode === "minor"
      ? "Common chord progressions in every minor key"
      : "Common chord progressions in every major key";

  return (
    <section>
      <h2>{caption || title}</h2>
      <p>
        {mode === "minor"
          ? "Read across one row to play a progression in that minor key. A capital V is the major dominant from harmonic minor."
          : "Read across one row to play a progression in that key. Uppercase numerals are major chords; lowercase are minor; ° is diminished."}
      </p>
      <div className="table-wrap">
        <table className="chart">
          <thead>
            <tr>
              <th scope="col">Key</th>
              {progressions.map((p) => (
                <th scope="col" key={p.id}>
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.tonic}>
                <th scope="row">{row.label}</th>
                {row.rows.map((r) => (
                  <td key={r.id} className="chords">
                    {r.chords.map((c) => c.name).join(" – ")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
