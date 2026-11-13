import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressionTool from "@/components/ProgressionTool";
import { canonicalPath } from "@/lib/config";
import { chartMatrix, MAJOR_PROGRESSIONS, MINOR_PROGRESSIONS } from "@/lib/theory";
import Link from "next/link";
import Faq from "@/components/Faq";
import { CIRCLE_FAQ } from "@/lib/faq";

export const metadata = {
  title: "Circle of Fifths Chord Progression Chart",
  description:
    "See and hear a circle of fifths chord progression in any key. Follow the circle, transpose the pattern, and print a simple reference chart.",
  alternates: { canonical: canonicalPath("/circle-of-fifths-chord-progression") },
  openGraph: {
    title: "Circle of Fifths Chord Progression Chart",
    description:
      "See and hear a circle of fifths chord progression in any key. Follow the circle, transpose the pattern, and print a simple reference chart.",
    type: "website",
    url: canonicalPath("/circle-of-fifths-chord-progression"),
  },
};

export default function CirclePage() {
  const majorShort = MAJOR_PROGRESSIONS.filter((p) => p.id === "circle-short" || p.id === "circle-full");
  const minorCircle = MINOR_PROGRESSIONS.filter((p) => p.id === "minor-circle");
  const majorMatrix = chartMatrix("major", majorShort);
  const minorMatrix = chartMatrix("minor", minorCircle);

  return (
    <>
      <Header current="/circle-of-fifths-chord-progression/" />
      <main className="wrap">
        <h1>Circle of Fifths Chord Progression</h1>
        <p className="lede">
          See and hear a circle of fifths chord progression in any key. Click
          around the circle to transpose, play the short vi–ii–V–I cell or the
          full diatonic loop, and print a simple reference chart.
        </p>

        <ProgressionTool
          defaultMode="major"
          defaultTonic="C"
          defaultStyleId="circle-short"
          allowedIds={["circle-short", "circle-full", "jazz-251"]}
          showCircle
        />

        <section className="prose">
          <h2>What is a circle of fifths progression?</h2>
          <p>
            On the circle of fifths, each step clockwise is up a perfect fifth
            (C to G to D), and each step counterclockwise is down a fifth.
            A circle of fifths chord progression follows that path: each chord
            root moves by a fifth, which is why the harmony feels like it is
            always falling forward into the next chord.
          </p>
          <p>
            The shortest useful cell is vi–ii–V–I. In C major that is Am–Dm–G–C.
            Stretch it to the full diatonic loop and you get
            I–IV–vii°–iii–vi–ii–V–I: C–F–B°–Em–Am–Dm–G–C. The jazz cadence
            ii7–V7–Imaj7 is the last three steps of the same idea, dressed with
            sevenths.
          </p>
        </section>

        <section>
          <h2>The progression in every key</h2>
          <div className="table-wrap">
            <table className="chart">
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">vi–ii–V–I</th>
                  <th scope="col">I–IV–vii°–iii–vi–ii–V–I</th>
                </tr>
              </thead>
              <tbody>
                {majorMatrix.map((row) => (
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

        <section>
          <h3>Minor-key circle of fifths</h3>
          <p>
            In minor the long form is i–iv–VII–III–VI–ii°–V–i, ending on a
            major V that pulls back to i. In A minor: Am–Dm–G–C–F–B°–E–Am.
          </p>
          <div className="table-wrap">
            <table className="chart">
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">i–iv–VII–III–VI–ii°–V–i</th>
                </tr>
              </thead>
              <tbody>
                {minorMatrix.map((row) => (
                  <tr key={row.tonic}>
                    <th scope="row">{row.label}</th>
                    <td className="chords">
                      {row.rows[0].chords.map((c) => c.name).join(" – ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="prose">
          Back to the main <Link href="/">chord progression chart</Link>, or
          open the{" "}
          <Link href="/12-bar-blues-chord-progression/">
            12 bar blues chord progression
          </Link>
          .
        </p>
        <Faq items={CIRCLE_FAQ} />
      </main>
      <Footer />
    </>
  );
}
