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
    </footer>
  );
}
