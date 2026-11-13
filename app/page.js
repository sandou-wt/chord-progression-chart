import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressionTool from "@/components/ProgressionTool";
import StaticChart from "@/components/StaticChart";
import { canonicalPath } from "@/lib/config";
import Link from "next/link";
import Faq from "@/components/Faq";
import { HOME_FAQ } from "@/lib/faq";

export const metadata = {
  title: "Chord Progression Chart: All 12 Keys (Free & Interactive)",
  description:
    "Free interactive chord progression chart for guitar and piano. Pick a key and a style, hear common progressions, transpose to any key, and print the chart. All 12 major and minor keys.",
  alternates: { canonical: canonicalPath("/") },
  openGraph: {
    title: "Chord Progression Chart: All 12 Keys (Free & Interactive)",
    description:
      "Free interactive chord progression chart for guitar and piano. Pick a key and a style, hear common progressions, transpose to any key, and print the chart.",
    type: "website",
    url: canonicalPath("/"),
  },
};

export default function HomePage() {
  return (
    <>
      <Header current="/" />
      <main className="wrap">
        <h1>Chord Progression Chart</h1>
        <p className="lede">
          A free interactive chord progression chart for guitar and piano. Pick a
          key and a style, hear the chords, transpose to any of the 12 major or
          minor keys, and print a clean chart. No signup, and nothing to install.
        </p>

        <ProgressionTool defaultMode="major" defaultTonic="C" defaultStyleId="pop-axis" />

        <section className="prose">
          <h2>What is a chord progression?</h2>
          <p>
            A chord progression is the order of chords in a song. The same few
            patterns appear again and again, which is why a short chart can cover
            so much music. Progressions are written with Roman numerals so one
            pattern works in every key: I is the first chord of the key, V is the
            fifth, and so on. Uppercase numerals are major chords, lowercase are
            minor, and ° marks a diminished chord.
          </p>
          <p>
            In C major, I–V–vi–IV is C–G–Am–F. In G major the same numerals
            become G–D–Em–C. Learn the numerals once, and you can move the
            pattern wherever you need it — that is what the transpose buttons do.
          </p>
        </section>

        <section className="prose">
          <h2>How to transpose a progression</h2>
          <p>
            Keep the Roman numerals and change the key. The tool updates every
            chord name for you, or you can read a new row in the full charts
            below. Chord progression charts like this one are built for that
            lookup: find the progression along the top, then read across the row
            of the key you want.
          </p>
        </section>

        <StaticChart mode="major" />
        <StaticChart mode="minor" />

        <section>
          <h2>Common chord progressions worth opening on their own page</h2>
          <div className="subpage-links">
            <Link className="card-link" href="/12-bar-blues-chord-progression/">
              <h3>12 bar blues chord progression</h3>
              <p>
                The standard and quick-change twelve bar blues forms, with
                dominant-7th chords in every key, plus a minor 12-bar.
              </p>
            </Link>
            <Link className="card-link" href="/circle-of-fifths-chord-progression/">
              <h3>Circle of fifths chord progression</h3>
              <p>
                Hear the descending-fifths progression and see it on the circle,
                from the short vi–ii–V–I cell to the full diatonic loop.
              </p>
            </Link>
          </div>
        </section>

        <Faq items={HOME_FAQ} />
      </main>
      <Footer />
    </>
  );
}
