import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BluesTool from "@/components/BluesTool";
import { canonicalPath } from "@/lib/config";
import { bluesBars, MAJOR_KEYS } from "@/lib/theory";
import Link from "next/link";
import Faq from "@/components/Faq";
import { BLUES_FAQ } from "@/lib/faq";

export const metadata = {
  title: "12 Bar Blues Chord Progression Chart (All Keys)",
  description:
    "Interactive 12 bar blues chord progression chart. See the standard and quick-change forms in any key, hear the dominant-7th chords, transpose, and print the 12-bar chart.",
  alternates: { canonical: canonicalPath("/12-bar-blues-chord-progression") },
  openGraph: {
    title: "12 Bar Blues Chord Progression Chart (All Keys)",
    description:
      "Interactive 12 bar blues chord progression chart. See the standard and quick-change forms in any key, hear the dominant-7th chords, transpose, and print the 12-bar chart.",
    type: "website",
    url: canonicalPath("/12-bar-blues-chord-progression"),
  },
};

export default function BluesPage() {
  const standardByKey = MAJOR_KEYS.map((tonic) => ({
    tonic,
    chords: bluesBars(tonic, "standard").map((c) => c.name),
  }));
  const quickByKey = MAJOR_KEYS.map((tonic) => ({
    tonic,
    chords: bluesBars(tonic, "quick-change").map((c) => c.name),
  }));

  return (
    <>
      <Header current="/12-bar-blues-chord-progression/" />
      <main className="wrap">
        <h1>12 Bar Blues Chord Progression</h1>
        <p className="lede">
          An interactive 12 bar blues chord progression chart. Choose a key,
          compare the standard and quick-change forms, hear the dominant-7th
          chords, transpose, and print the twelve bar grid.
        </p>

        <BluesTool defaultForm="standard" />

        <section className="prose">
          <h2>Standard 12-bar form</h2>
          <p>
            The standard 12-bar blues uses only I, IV and V, almost always as
            dominant 7th chords, over twelve measures: I7 for the first four
            bars, IV7 for bars 5–6, back to I7 for bars 7–8, then V7–IV7–I7–V7
            (the last bar is a turnaround that leads into the next chorus). In
            E, a favorite guitar key, that is E7, A7 and B7.
          </p>
        </section>

        <section>
          <h2>12 bar blues in every key</h2>
          <p>
            Each row is one complete chorus of the standard form. Chords are
            listed in bar order, from 1 to 12.
          </p>
          <div className="table-wrap">
            <table className="chart">
              <thead>
                <tr>
                  <th scope="col">Key</th>
                  <th scope="col">Bars 1–4</th>
                  <th scope="col">Bars 5–8</th>
                  <th scope="col">Bars 9–12</th>
                </tr>
              </thead>
              <tbody>
                {standardByKey.map((row) => (
                  <tr key={row.tonic}>
                    <th scope="row">{row.tonic}</th>
                    <td className="chords">{row.chords.slice(0, 4).join(" – ")}</td>
                    <td className="chords">{row.chords.slice(4, 8).join(" – ")}</td>
                    <td className="chords">{row.chords.slice(8, 12).join(" – ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="prose">
          <h2>Quick-change 12-bar blues</h2>
          <p>
            In the quick-change form, bar 2 moves to IV7 and bar 3 returns to
            I7. Everything else stays the same. It is a small move with a lot of
            forward motion, and it is the version many jazz and jump-blues
            tunes use.
          </p>
        </section>

        <div className="table-wrap">
          <table className="chart">
            <thead>
              <tr>
                <th scope="col">Key</th>
                <th scope="col">Bars 1–4 (quick change)</th>
                <th scope="col">Bars 5–8</th>
                <th scope="col">Bars 9–12</th>
              </tr>
            </thead>
            <tbody>
              {quickByKey.map((row) => (
                <tr key={row.tonic}>
                  <th scope="row">{row.tonic}</th>
                  <td className="chords">{row.chords.slice(0, 4).join(" – ")}</td>
                  <td className="chords">{row.chords.slice(4, 8).join(" – ")}</td>
                  <td className="chords">{row.chords.slice(8, 12).join(" – ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="prose">
          Back to the main <Link href="/">chord progression chart</Link>, or
          try the{" "}
          <Link href="/circle-of-fifths-chord-progression/">
            circle of fifths chord progression
          </Link>
          .
        </p>
        <Faq items={BLUES_FAQ} />
      </main>
      <Footer />
    </>
  );
}
