import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span>Free interactive chord progression chart. No signup.</span>
        <span>
          <Link href="/">Home</Link>
          {" · "}
          <Link href="/12-bar-blues-chord-progression/">12-bar blues</Link>
          {" · "}
          <Link href="/circle-of-fifths-chord-progression/">Circle of fifths</Link>
        </span>
      </div>
      <p className="footer-credit">
        Guitar sounds: University of Iowa Electronic Music Studios samples, edited by{" "}
        <a href="https://github.com/nbrosowsky/tonejs-instruments" rel="noopener">
          nbrosowsky/tonejs-instruments
        </a>{" "}
        (
        <a href="https://creativecommons.org/licenses/by/3.0/" rel="license noopener">
          CC BY 3.0
        </a>
        ), trimmed and re-encoded.
      </p>
    </footer>
  );
}
