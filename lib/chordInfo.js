/**
 * What each chord tends to do and how it often feels, by Roman numeral.
 * Context: "major", "minor" (natural/harmonic minor keys) or "blues".
 * Colour words describe common listening impressions, not fixed rules.
 */

export const FUNCTION_GROUPS = {
  tonic: "Tonic",
  predominant: "Predominant",
  dominant: "Dominant",
  colour: "Colour",
};

const MAJOR = {
  I: {
    fn: "Tonic",
    group: "tonic",
    tag: "home, stable",
    note: "The key’s home base. Phrases often start here and usually feel finished when they land here.",
  },
  Imaj7: {
    fn: "Tonic",
    group: "tonic",
    tag: "home, but soft and open",
    note: "Home with an added major 7th. It still resolves, yet often sounds dreamy or relaxed rather than final.",
  },
  ii: {
    fn: "Predominant",
    group: "predominant",
    tag: "gentle predominant",
    note: "A soft minor chord that leads naturally to V. It often feels like a step toward tension rather than tension itself.",
  },
  ii7: {
    fn: "Predominant",
    group: "predominant",
    tag: "smooth setup",
    note: "The minor 7th version of ii, the first step of the ii–V–I. Its 7th tends to slide down by step into V’s 3rd.",
  },
  iii: {
    fn: "Tonic substitute",
    group: "colour",
    tag: "dreamy, ambiguous",
    note: "Shares two notes with I and two with V, so it can sound either restful or slightly unsettled depending on context.",
  },
  IV: {
    fn: "Subdominant (predominant)",
    group: "predominant",
    tag: "lifting away, warm",
    note: "Moves away from home without real tension. It often feels open and hopeful, and leads well to V or straight back to I.",
  },
  V: {
    fn: "Dominant",
    group: "dominant",
    tag: "tension, wants home",
    note: "Contains the leading tone a half step below the tonic, so it usually creates a pull back to I.",
  },
  V7: {
    fn: "Dominant",
    group: "dominant",
    tag: "strong pull home",
    note: "V with a minor 7th added. The tritone between its 3rd and 7th makes the pull to I even stronger.",
  },
  vi: {
    fn: "Tonic substitute (relative minor)",
    group: "tonic",
    tag: "bittersweet relative minor",
    note: "Shares two notes with I, so it can stand in for home while adding a darker, often wistful colour.",
  },
  "vii°": {
    fn: "Dominant (leading-tone chord)",
    group: "dominant",
    tag: "tense, unstable",
    note: "A diminished triad built on the leading tone. It acts like a lighter V and rarely sits still.",
  },
};

const MINOR = {
  i: {
    fn: "Tonic",
    group: "tonic",
    tag: "home, dark and grounded",
    note: "Home in a minor key. It often sounds serious or melancholy, and phrases usually rest here.",
  },
  "ii°": {
    fn: "Predominant",
    group: "predominant",
    tag: "uneasy, leaning forward",
    note: "A diminished chord that sets up V. Its shrunken fifth usually makes it sound restless.",
  },
  III: {
    fn: "Relative major",
    group: "colour",
    tag: "brief brightness",
    note: "The relative major chord. In a minor progression it often feels like a short ray of light.",
  },
  iv: {
    fn: "Subdominant (predominant)",
    group: "predominant",
    tag: "brooding, heavy",
    note: "The minor four chord. It moves away from home and often deepens the sad or dramatic mood.",
  },
  v: {
    fn: "Minor dominant (soft)",
    group: "dominant",
    tag: "modal, mild pull",
    note: "The natural-minor five chord has no leading tone, so it pulls back to i only gently and sounds more modal or folky.",
  },
  V: {
    fn: "Dominant (from harmonic minor)",
    group: "dominant",
    tag: "dramatic tension",
    note: "Raising the 7th scale degree makes V major, which gives a strong, often dramatic pull back to i.",
  },
  VI: {
    fn: "Predominant / tonic substitute",
    group: "predominant",
    tag: "warm, wide, cinematic",
    note: "A major chord a step above V. It often sounds broad and emotional, and leads easily to VII or V.",
  },
  VII: {
    fn: "Subtonic",
    group: "colour",
    tag: "rock/modal swagger",
    note: "Built a whole step below the tonic. It has no leading tone, so it moves home with a confident, rock-style lift rather than a classical pull.",
  },
};

const BLUES = {
  I7: {
    fn: "Tonic (dominant-7th colour)",
    group: "tonic",
    tag: "home with grit",
    note: "In the blues the home chord keeps its 7th. It feels like home but never fully at rest, which keeps the groove moving.",
  },
  IV7: {
    fn: "Subdominant",
    group: "predominant",
    tag: "the lift in bar 5",
    note: "The move to IV7 often sounds like the second line of a blues verse, a step away before returning home.",
  },
  V7: {
    fn: "Dominant",
    group: "dominant",
    tag: "tension and turnaround",
    note: "Arrives in bar 9 for the strongest tension, and returns in bar 12 as the turnaround that leads into the next chorus.",
  },
  i7: {
    fn: "Tonic (minor 7th)",
    group: "tonic",
    tag: "home, dark and smoky",
    note: "The minor blues home chord. Its minor 3rd and 7th often sound moody and late-night.",
  },
  iv7: {
    fn: "Subdominant (minor 7th)",
    group: "predominant",
    tag: "deeper, heavier",
    note: "The minor IV deepens the mood in bars 5–6 before the music returns home.",
  },
};

export function chordInfo(numeral, context) {
  const table = context === "blues" ? BLUES : context === "minor" ? MINOR : MAJOR;
  return table[numeral] || null;
}

export const CHORD_INFO_TABLES = { major: MAJOR, minor: MINOR, blues: BLUES };
