import Link from "next/link";

const LINKS = [
  { href: "/", label: "Chart" },
  { href: "/12-bar-blues-chord-progression/", label: "12-Bar Blues" },
  { href: "/circle-of-fifths-chord-progression/", label: "Circle of Fifths" },
];

export default function Header({ current = "/" }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/">
          Chord Progression Chart
        </Link>
        <nav className="nav" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={current === l.href ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
