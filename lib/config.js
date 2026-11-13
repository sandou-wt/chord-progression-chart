/**
 * Site origin is empty until a domain is purchased.
 * Canonical tags and the sitemap use a documented placeholder only.
 */
export const SITE_NAME = "Chord Progression Chart";
export const PLACEHOLDER_ORIGIN = "https://chord-progression-chart.vercel.app";

export function canonicalPath(path) {
  const normalized = path === "/" ? "/" : path.replace(/\/$/, "");
  return `${PLACEHOLDER_ORIGIN}${normalized}`;
}
