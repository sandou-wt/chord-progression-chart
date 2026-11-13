/**
 * Per-progression write-ups and well-documented song examples.
 * Songs: title, artist and section only (no lyrics, no melodies). Key is listed only
 * where the original recording's key is well documented.
 */

export const SONG_DISCLAIMER =
  "Songs are listed for their harmony only. Recordings may use a different key, add passing chords, or use the progression in just one section.";

export const PROGRESSION_NOTES = {
  "pop-axis": {
    why: [
      "I–V–vi–IV works because it runs a complete small story of stability, tension and colour in four bars, then loops back without a hard stop. I sets up home. V raises tension right away, but instead of resolving it to I, the progression slides to vi. That is a deceptive move: vi shares two notes with I, so it feels close to home but darker and more emotional.",
      "IV then opens things up again. It is the warmest, least tense chord in the loop, and it sits a fourth above the tonic, so the step from IV back to I sounds like a gentle “amen” rather than a strong cadence. That softness is why the loop can repeat for a whole song without sounding finished.",
      "The voice leading is very smooth. Most neighbouring chords share notes (C–G share G, Am–F share A and C, F–C share C), and where they don’t, from G to Am, every voice can move by a single step, so the top voice can stay almost still. The bass line I–V–vi–IV also makes a strong shape: down a fourth, up a step, down a third.",
      "The same four chords sound hopeful when you start on I and more wistful when you start on vi, which is why vi–IV–I–V feels like a different progression.",
    ],
    songs: [
      { song: "Let It Be", artist: "The Beatles", section: "Verse and chorus", key: "C" },
      { song: "No Woman, No Cry", artist: "Bob Marley & the Wailers", section: "Throughout", key: "C" },
      { song: "With or Without You", artist: "U2", section: "Throughout", key: "D" },
      { song: "Don’t Stop Believin’", artist: "Journey", section: "Opening and verse", key: "E" },
      { song: "I’m Yours", artist: "Jason Mraz", section: "Verse and chorus", key: "B" },
      { song: "Someone Like You", artist: "Adele", section: "Verse and chorus", key: "A" },
    ],
  },
  classic: {
    why: [
      "I–IV–V uses the three primary chords of the key, and between them they contain every note of the major scale. That is why so much folk, gospel, country and early rock and roll can be played with just these shapes.",
      "Each chord has a clear job. I is home. IV moves away without tension; it often sounds bright and open. V adds the leading tone, the note a half step under the tonic, and that note wants to rise to the tonic. When V goes back to I, you get the strongest resolution in tonal music, the authentic cadence.",
      "The motion is also physical. The bass climbs I–IV–V, building energy step by step, then drops or leaps back to I. Because IV and V are next to each other, the change between them is quick and punchy, which suits rhythm guitar and dance grooves.",
      "As a loop, it keeps restarting from a strong home chord, so it sounds confident rather than mysterious. Change the order to I–IV–I–V, or hold IV for two bars, and you are close to the twelve-bar blues, which grew from the same three chords.",
    ],
    songs: [
      { song: "La Bamba", artist: "Ritchie Valens", section: "Main riff and verse" },
      { song: "Twist and Shout", artist: "The Beatles (Isley Brothers song)", section: "Throughout", key: "D" },
      { song: "Wild Thing", artist: "The Troggs", section: "Main riff (I–IV–V–IV)", key: "A" },
      { song: "Hang On Sloopy", artist: "The McCoys", section: "Throughout (I–IV–V–IV)" },
    ],
  },
  "doo-wop": {
    why: [
      "I–vi–IV–V is the “50s progression”. It moves from home to the relative minor, then through IV to V, which hands the music straight back to I. Because it ends on V, every repeat begins with a satisfying resolution.",
      "The bass line is a big part of the appeal. In C it falls C–A–F and then rises to G: down a third, down a third, up a step. Falling thirds sound graceful, and the final step up to V creates lift right before the return home.",
      "The colour changes in a clear arc: bright (I), tender (vi), warm (IV), expectant (V). vi shares two notes with I, so the change from I to vi is soft; IV shares two notes with vi, so that change is soft too. Only the move to V brings real tension, which makes the loop feel gentle and romantic overall.",
      "Swap IV for ii and you get I–vi–ii–V, the jazz and show-tune “turnaround” that leads into the circle of fifths. The two versions are close relatives and you will hear them side by side in many standards.",
    ],
    songs: [
      { song: "Stand By Me", artist: "Ben E. King", section: "Verse and chorus", key: "A" },
      { song: "Every Breath You Take", artist: "The Police", section: "Verse" },
      { song: "Earth Angel", artist: "The Penguins", section: "Verse" },
      { song: "Unchained Melody", artist: "The Righteous Brothers", section: "Verse" },
      { song: "Duke of Earl", artist: "Gene Chandler", section: "Throughout" },
    ],
  },
  "axis-rotation": {
    why: [
      "vi–IV–I–V uses the same four chords as I–V–vi–IV but starts on the relative minor. That one change shifts the whole mood: the loop now begins in shadow and climbs toward light, so it often sounds more urgent or emotional.",
      "Harmonically, vi and IV share two notes, so the opening is smooth and dark. I arrives on the third bar like a moment of release, and V on the fourth bar sets up the return to vi rather than to I. That is a deceptive resolution every time around, which keeps the loop restless and helps it repeat for minutes without feeling resolved.",
      "Because there is no strong arrival on the first beat, many writers use this order for choruses that need drive, then switch to I–V–vi–IV elsewhere for contrast.",
      "Seen from the relative minor, the same chords are i–VI–III–VII, the “epic” minor progression. That double identity is why it fits both pop anthems and darker rock.",
    ],
    songs: [
      { song: "Zombie", artist: "The Cranberries", section: "Verse and chorus" },
      { song: "Save Tonight", artist: "Eagle-Eye Cherry", section: "Throughout" },
      { song: "Despacito", artist: "Luis Fonsi feat. Daddy Yankee", section: "Throughout" },
    ],
  },
  "pop-variant": {
    why: [
      "I–IV–vi–V keeps the four pop chords but puts the warm IV right after home and saves the minor chord for the third bar. The first half sounds open and bright (I to IV, a classic lift), and the second half adds weight: vi darkens the colour, then V builds tension right before the loop returns to I.",
      "Ending on V gives each repeat a clear resolution back to I, so this order feels more settled than vi–IV–I–V. The bass climbs I–IV–vi, then steps down to V, which makes a pleasant arch shape under a melody.",
      "The move from IV to vi is smooth because the two chords share two notes, and vi to V moves every voice by step, which sounds natural on guitar and piano.",
      "Try it when I–V–vi–IV feels too familiar: it has the same palette of chords but a different emotional curve. It also works well as a pre-chorus, because the final V leaves the listener expecting a return home.",
    ],
    songs: [],
  },
  "jazz-251": {
    why: [
      "ii7–V7–Imaj7 is the core cadence of jazz. The roots move down by fifths (D–G–C in C major), the strongest root motion in tonal harmony, so each chord sounds like it leads straight into the next.",
      "The real magic is in the guide tones, the 3rds and 7ths. The 7th of Dm7 (C) slips down a half step to the 3rd of G7 (B). The 7th of G7 (F) slips down to the 3rd of Cmaj7 (E). Two voices moving by tiny steps carry the whole harmony, which is why the cadence sounds so smooth even with rich four-note chords.",
      "G7 also contains a tritone (B and F). That interval is unstable, and resolving it inward to C and E gives the arrival on Imaj7 its sense of release. The major 7th on the final chord keeps the ending soft rather than blunt.",
      "Jazz tunes chain ii–V–Is through different keys, so learning to hear this three-chord move is one of the quickest ways to make sense of standards.",
    ],
    songs: [
      { song: "Autumn Leaves", artist: "Joseph Kosma (jazz standard)", section: "A section, ii–V–I chains" },
      { song: "Satin Doll", artist: "Duke Ellington", section: "A section, ii–V chains" },
      { song: "Tune Up", artist: "Miles Davis", section: "ii–V–I in three keys" },
      { song: "Honeysuckle Rose", artist: "Fats Waller", section: "Opening ii–V" },
    ],
  },
  "circle-short": {
    why: [
      "vi–ii–V–I moves every chord root down a fifth (A–D–G–C in C major). Root motion by fifths is the strongest pull in tonal music, so this short cell sounds inevitable: each chord sets up the next, and the last step lands squarely on home.",
      "It also travels from colour to resolution. vi is a gentle minor stand-in for home, ii is the soft predominant, V brings the tension, and I resolves it. The first two chords are minor, so the arrival on the major chords at the end feels like light coming in.",
      "The voices barely need to move. Each chord shares a note with the next, and the rest move by step, so the progression sounds smooth even when played in simple shapes. Add sevenths (Am7–Dm7–G7–Cmaj7) and you get the classic jazz sound.",
      "Played as I–vi–ii–V, the same chords become a turnaround that loops back to the start of a song, which is why you hear it under so many standards and old pop tunes.",
    ],
    songs: [
      { song: "Fly Me to the Moon", artist: "Bart Howard (popularized by Frank Sinatra)", section: "Opening bars" },
      { song: "I Got Rhythm", artist: "George Gershwin", section: "A section, as I–vi–ii–V" },
      { song: "Blue Moon", artist: "Rodgers & Hart", section: "Main loop, as I–vi–ii–V" },
    ],
  },
  "circle-full": {
    why: [
      "I–IV–vii°–iii–vi–ii–V–I visits every chord in the key, and every root moves down a fifth (or up a fourth) until it lands back on I. The sequence is so regular that, once you have heard two or three steps, your ear can predict the rest. That predictability is satisfying rather than boring, because the colour changes on every chord.",
      "One fifth in the chain is diminished (F down to B in C major) rather than perfect. That is the only way to stay inside the key, and it is why the vii° chord appears halfway through. It adds a brief moment of instability, right in the middle of the journey.",
      "Melodies over this progression often fall into sequences: the same small idea repeated a step lower on each chord. The harmony makes those sequences sound purposeful, which is why Baroque music, jazz standards and pop ballads all use it.",
      "The final three chords, ii–V–I, are the strongest cadence in the key, so the long chain ends with a clear sense of arrival.",
    ],
    songs: [
      { song: "Autumn Leaves", artist: "Joseph Kosma (jazz standard)", section: "A section, the chain starting from ii" },
      { song: "Fly Me to the Moon", artist: "Bart Howard (popularized by Frank Sinatra)", section: "Opening, the chain starting from vi" },
    ],
  },
  "minor-145": {
    why: [
      "i–iv–v is the basic one–four–five in natural minor. All three chords are minor, so the mood stays dark and even throughout. There is no leading tone in the natural minor v chord, which means the return to i is soft rather than dramatic.",
      "That softness is the point. The progression sounds modal and a little ancient, close to folk, early music and some rock and film writing. Nothing pushes hard toward resolution, so it loops calmly, like a chant.",
      "The voice leading is simple: i and iv share the tonic note, and iv to v moves by step. If you want a stronger ending, swap the last chord for the major V (see i–iv–V), and you will hear how much the single raised note changes the pull.",
      "Melodies fit naturally into the natural minor or minor pentatonic scale. Landing on the tonic or the minor 3rd over i, and on the 7th degree (a whole step below the tonic) over v, keeps the modal sound intact.",
    ],
    songs: [],
  },
  "harmonic-cadence": {
    why: [
      "i–iv–V borrows a major V from the harmonic minor scale. The raised 7th degree turns V into a major chord with a leading tone, a half step below the tonic, so the final chord pulls hard back to i. The contrast between the two dark minor chords and the bright, tense V gives this progression its drama.",
      "The bass climbs i–iv–V and then resolves down a fifth or up a fourth to i, the strongest cadence available. Inside the chords, the leading tone rises by a half step to the tonic, and the 4th degree of the iv chord falls to the 3rd of i, which makes the resolution feel complete.",
      "This is the minor-key cadence of classical music and of many folk and flamenco-influenced songs. Use it when a minor-key loop needs a real sense of arrival.",
      "When you write a melody over it, use the natural minor scale for i and iv, then switch to the raised 7th over V. That one changed note tells the listener the ending is coming.",
    ],
    songs: [],
  },
  "epic-minor": {
    why: [
      "i–VI–III–VII is the minor-key view of the four-chord pop loop (the same chords as vi–IV–I–V in the relative major). Starting on i gives it weight; the major chords VI, III and VII then lift the mood step by step, which is why it often sounds heroic or cinematic.",
      "There is no leading tone in VII, so the return from VII to i is a whole-step lift rather than a classical cadence. It sounds strong and modern, and it lets the loop roll on indefinitely, which suits rock riffs, film cues and anthemic choruses.",
      "The voices move smoothly: i and VI share two notes, VI and III share one, and III to VII moves by fifth. That mix of common tones and big root moves makes the progression sound both connected and wide.",
      "Simple, repeated melodies work best here. Let the chords change the colour underneath a short figure that stays almost the same, and the loop will do the emotional lifting for you.",
    ],
    songs: [
      { song: "Zombie", artist: "The Cranberries", section: "Verse and chorus (as vi–IV–I–V)" },
      { song: "Save Tonight", artist: "Eagle-Eye Cherry", section: "Throughout" },
      { song: "Despacito", artist: "Luis Fonsi feat. Daddy Yankee", section: "Throughout" },
    ],
  },
  andalusian: {
    why: [
      "The Andalusian cadence, i–VII–VI–V, walks the bass down four steps of the minor scale (A–G–F–E in A minor). A descending bass line like this often sounds like a lament, and the steady step-by-step fall gives the progression a feeling of gravity.",
      "The last chord is a major V. Its leading tone (G♯ in A minor) wants to rise to the tonic, so the cadence ends with real tension and pulls the loop back to i. The move VI to V is just a half step in the bass, which adds a flamenco or Phrygian flavour.",
      "Three of the four chords are major, yet the overall feel is dark, because the progression starts and ends in minor and the melody tends to follow the falling bass. It loops naturally and has been used from Renaissance dances to surf rock and pop.",
      "For melodies, the natural minor scale fits the first three chords; over the final V, swap in the raised 7th. A small turn around one note, repeated a step lower on each chord, mirrors the bass nicely.",
    ],
    songs: [
      { song: "Hit the Road Jack", artist: "Ray Charles", section: "Throughout" },
      { song: "Runaway", artist: "Del Shannon", section: "Verse" },
      { song: "Walk, Don’t Run", artist: "The Ventures", section: "Main theme" },
      { song: "Sultans of Swing", artist: "Dire Straits", section: "Verse" },
    ],
  },
  "aeolian-rock": {
    why: [
      "i–VI–VII stays entirely inside the natural minor (Aeolian) scale. VI and VII are major chords that climb by step back to i, so the loop sounds like a determined push upward, a favourite move in rock and metal.",
      "Because VII has no leading tone, the return to i is a whole-step lift rather than a classical cadence. That gives the progression power without sounding formal, and it means the loop never really stops; each time it reaches i it is ready to go again.",
      "On guitar, the three chords often appear as power chords moving in parallel, which strengthens the climbing motion. Melodies tend to use the minor pentatonic or natural minor scale and land on the tonic with the arrival on i.",
      "With only three chords, rhythm matters as much as harmony. A syncopated riff that pushes slightly ahead of the beat on each chord change gives this short loop much of its energy.",
    ],
    songs: [],
  },
  "minor-circle": {
    why: [
      "i–iv–VII–III–VI–ii°–V–i follows the circle of fifths through every chord of a minor key. The roots fall by fifths, which gives the sequence a sense of inevitability, while the chords alternate between minor and major colours.",
      "The first half, i–iv–VII–III, travels toward the relative major: VII is the dominant of III, so arriving on III feels like a brief, warm resolution. The second half, VI–ii°–V–i, turns back home, and the major V (borrowed from harmonic minor) gives the return a strong, dramatic pull.",
      "Because the pattern is so regular, melodies over it often move in sequences, repeating a short figure a step lower on each chord. Disco, jazz standards and Baroque pieces all rely on this chain.",
      "The one unstable moment is ii°, the diminished chord in bar six. It adds a brief edge just before V, which makes the final resolution to i feel even more earned. Add sevenths and the progression becomes the minor side of many jazz standards.",
    ],
    songs: [
      { song: "I Will Survive", artist: "Gloria Gaynor", section: "Verse and chorus" },
      { song: "Fly Me to the Moon", artist: "Bart Howard (popularized by Frank Sinatra)", section: "Opening bars" },
      { song: "Autumn Leaves", artist: "Joseph Kosma (jazz standard)", section: "Minor-key half of the A section" },
    ],
  },
  blues: {
    why: [
      "The 12-bar blues uses only I, IV and V, but all three are dominant 7th chords. In classical harmony a dominant 7th wants to resolve; in the blues, even the home chord carries that 7th, so the music feels at home and restless at the same time. That tension is a big part of the blues sound.",
      "The form works like a three-line verse. Bars 1–4 state the idea on I7. Bars 5–8 repeat it over IV7 and back to I7, so the same melody sounds different over new harmony. Bars 9–12 answer it: V7 brings the strongest tension, IV7 softens it, and I7 resolves, with V7 in bar 12 acting as the turnaround that sends you back to the top.",
      "Melodies mix the major chord tones with the blues scale’s flattened 3rd, 5th and 7th. Those blue notes rub against the chords in a way the ear hears as expressive rather than wrong, especially over I7, where the minor 3rd of the melody meets the major 3rd of the chord.",
      "The quick-change version moves to IV7 in bar 2 for extra early motion. The minor blues swaps in i7 and iv7 for a darker, moodier colour while keeping the same shape.",
    ],
    songs: [
      { song: "Johnny B. Goode", artist: "Chuck Berry", section: "Verse (standard 12-bar)", key: "B♭" },
      { song: "Hound Dog", artist: "Elvis Presley", section: "Throughout (12-bar)" },
      { song: "Rock Around the Clock", artist: "Bill Haley & His Comets", section: "Verse (12-bar)" },
      { song: "Pride and Joy", artist: "Stevie Ray Vaughan", section: "Throughout (12-bar shuffle)" },
      { song: "Tutti Frutti", artist: "Little Richard", section: "Verse (12-bar)" },
      { song: "The Thrill Is Gone", artist: "B.B. King", section: "Minor 12-bar with a VI–V variation", key: "B minor" },
      { song: "Mr. P.C.", artist: "John Coltrane", section: "Minor 12-bar", key: "C minor" },
    ],
  },
};
