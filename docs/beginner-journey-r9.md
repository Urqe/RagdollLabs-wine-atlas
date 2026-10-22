# R9 — Your First Glass

Implemented 2026-10-21. The optional beginner journey introduces four sensory concepts before the full production guide and leads into R8's existing Sauvignon Blanc flight. No wines, sensory scores, accounts, quizzes or persistent learning records are added.

## Learning experience

“New to wine?” now opens a short introduction with a clear Begin action, an optional comparison shortcut and access to the full reference. The sidebar also provides a direct journey entry; experienced users retain Explore and Compare.

The four lessons separate mouth-watering acidity, drying/grippy tannin, perceived weight/body and residual sweetness. Each offers a concise cue, an observation exercise that can be imagined without drinking wine, and a takeaway. The text explicitly distinguishes acidity from tannin, dry wine from drying tannin, fruit aroma from sugar, and body from quality.

Each concept links to an existing profile and a relevant flight. Examples and reference material sit behind optional disclosures; the next lesson remains the prominent action. Definitions come from the existing glossary, and deeper production/score detail opens the existing guide. A free step list permits skipping, revisiting and finishing without gates. The end page summarizes four observation questions and offers exploration or restart; it does not measure or certify understanding.

The first-comparison page uses the existing Sancerre/Marlborough Sauvignon Blanc flight. Both selected references are dry white wines; their modeled aroma/style contrasts do not establish measured sugar differences or a controlled climate experiment.

## Data and navigation

`data/beginner-journey.json` supplies the four lessons, glossary/profile/flight/guide references and first flight. `beginner-journey.js` renders text safely and delegates wine calculations, dialogs and comparison to their existing owners. The validator checks the exact lesson sequence, meaningful text and all linked references.

`?view=learn&lesson=<id>` identifies the current page. A validated lesson marker carries a return link through its examples, linked flight, Compare, worksheet and flight-member profiles. Unrelated profiles, invalid context and manual comparisons that no longer match the flight discard that marker. Existing URLs remain valid. See [navigation](navigation.md).

Refresh and Back/Forward restore the current route, focus and disclosure state through the existing router. Dialogs restore the actual invoking control on close/Escape, including a non-native-dialog fallback. Navigating away invalidates pending glossary/guide opens so a late response cannot cover the next lesson or steal its focus.

Optional loading is bounded and does not block ordinary wine browsing. Missing journey data shows a visible restart/explore fallback. Missing glossary or flight enrichment still leaves observation text and lesson progression available. There is no localStorage/sessionStorage learning history.

## Evidence boundaries

This release reframes existing introductory concepts and uses shared glossary definitions. It does not reverify the catalog or close the existing claim-level evidence backlog. The linked profiles retain their source and evidence-limit disclosures; analogies and tasting prompts are teaching aids, not measured equivalences or guarantees of bottle style. The time estimate on the start page is approximate, not a measured usability result.

## Verification

- `npm run validate`: syntax, data contracts, advisory audit and the existing suite plus beginner-journey regressions.
- Coverage includes begin/skip/restart/finish, every lesson deep-link, profile returns, disclosure and focus restoration, glossary/guide close and cancel behavior, guide-section targeting, lesson context through flight/Compare/worksheet/profile routes, refresh, invalid context, data failures, nonblocking loading, late-response cancellation and safe text rendering.
- Reopening the same flight from different lessons is tested to ensure its return links update rather than reuse a stale lesson marker.
- Validator fixtures reject invalid lesson IDs/order, unknown definitions/profiles/flights/guide sections and missing exercises.
- Deployed desktop Chrome checks passed: the New to wine entry, all four lessons, finish/restart, native glossary Escape and guide Close with invoker-focus restoration, profile Back with restored disclosure/focus, the R8 flight/Compare handoff, refresh with lesson context, and Tab to the primary action. Intro and lesson layouts were visually inspected and had no horizontal overflow at the desktop viewport.
- iPhone/iPad Safari, physical touch, real screen-reader use and enlarged-text/mobile layout checks remain unverified. Automated DOM tests do not claim to verify these. No learner usability/retention study has been performed.

R10's broader bottle-label guidance remains a separate planned release. R9 uses the existing R8 flight-selection cues only.

R11 extends this historical R9 baseline with a tasting-method step, practical wine pairs, optional ephemeral scratch notes and guidance after observation. See [Learn to Taste](learn-to-taste-r11.md); the original five-minute vocabulary-only description no longer describes the whole journey.
