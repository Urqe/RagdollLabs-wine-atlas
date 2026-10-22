# R12 — Find the Notes

Implemented 2026-10-22 as an optional branch of Your First Glass at `?view=learn&lesson=aromas`. Start, Finish and the journey step list link to it. The four structure lessons, method and existing comparison skip remain unchanged.

## What the learner sees

An independent observation field comes before closed optional vocabulary and reference disclosures. Readers may use a broad family, refine a familiar example, describe an association from their own food culture, or remain uncertain. The six vocabulary families are fruity, floral, herbal, spicy, toasty and earthy/savoury; this is an original small set of prompts, not a copied aroma wheel. Flavour/aroma association is not proof of an ingredient, soil transfer or a uniquely identifiable region.

A short optional explanation connects smelling above the glass (orthonasal) with aroma reaching the nose from the mouth (retronasal), keeping basic tastes and texture separate. No tasting or wine purchase is necessary for the household smelling exercises. Reading remains distinct from practicing actual recognition.

The starter references use washed lemon peel, freshly cut apple, plain raisins, fresh mint, a cinnamon stick and cooled plain toast in clean separate glasses. Preparation instructions are original household suggestions, not analytical standards or universal concentrations. Skip unsuitable materials; no powders, essential oils, unknown plants or soil samples are prescribed. These examples cover only part of the vocabulary. Familiarity, food variety, freshness and individual sensitivity affect the result.

First smell a named material and write a useful memory. Revisit with its label covered and compare later on another occasion. Optional partner-prepared matching gives a bounded next exercise, rather than pretending an app can supply an odour.

## Coded reference matching

A partner chooses two different, actually prepared references and privately records the contents of A and B. The app rejects empty or duplicate setup. Starting the round removes the entire setup and named-reference DOM; it does not merely collapse or hide the selected mapping. The learner sees neutral A/B labels, a fresh scratchpad and the announced candidate set of six references. Guessing is optional; uncertain is valid.

Only an explicit reveal displays the partner-recorded contents. Feedback compares each selection with that recorded identity, or invites another comparison when uncertain/different. It does not judge a wine descriptor against a modeled score or imply wine-identification skill. The app cannot verify the physical containers; wrong setup must be resolved with the partner. Reset clears the coded notes/mapping and requires new setup. Ending an unrevealed round also clears it.

The current round lives only in a component closure. Guesses survive navigation away and back without revealing identities; refresh ends the round. The scratchpad reuses Journey's memory-only notes with a separate coded-round key. No mapping, guess or note enters URLs, localStorage or sessionStorage. Source/reference data is public static content; this is learning support, not anti-cheat security.

## Architecture and evidence

`aroma-practice.js` is a renderer/state component for this branch. `WineJourney` remains the lesson owner and `WineNavigation` owns URL/history/focus. Stage transitions rerender through that same route, orienting focus to a descriptive heading. There is no second router, wine model, progress database, profile score change or new tasting flight.

`data/aroma-practice.json` holds original families, reference preparation/reflection and scoped teaching sources. Runtime guards reject malformed data and non-HTTPS source URLs, offering a method link while the four vocabulary lessons and browsing remain usable. Blocking validation checks families, reference identities/preparation and sources.

Primary teaching inputs reviewed 2026-10-22:

- [WSET, How to train your palate](https://www.wsetglobal.com/knowledge-centre/blog/2026/how-to-train-your-palate): everyday aroma memories, general-to-specific vocabulary and comparison. The household preparations and interface are original; no tasting grid or certification material is reproduced.
- [UC Davis, Sensory Evaluation of Wine course profile](https://news.bftv.ucdavis.edu/viticulture-and-enology/course-profile-professor-hildegarde-heymanns-class-sensory-evaluation-wine): individual sensory variation and labeled/coded/matching reference practice. A description of an advanced course is inspiration, not evidence of this small exercise's efficacy or a reason to copy its scale/exam.
- [NIDCD, How taste works](https://www.nidcd.nih.gov/health/taste-disorders): aroma perception from the mouth, basic taste and texture. No fixed tongue map is taught.

## Verification and limits

- Targeted tests cover direct-route entry, closed optional vocabulary, independent notes, safe text, setup errors, neutral matching DOM, explicit reveal, uncertain and different choices, reversed mappings in new rounds, navigation without premature reveal, memory-only state, reset/fresh-instance behavior and malformed/unsafe optional data.
- Blocking fixtures reject missing preparation, duplicate reference IDs, unknown families and unsafe sources. Existing journey deep-link tests include the new route.
- Full `npm run validate`: passed, including all existing and new aroma-practice suites. Deployed desktop Chrome checks pass: independent note entry; optional family/refinement; partner setup; neutral matching without setup/reference DOM; notes and guesses retained through acidity → return without reveal; explicit reveal of recorded Lemon/Mint samples with matching/different feedback; reset to blank setup; visible 3px keyboard focus on the observation field. Desktop feedback layout was visually inspected without horizontal overflow. Reveal-stage instructions now explicitly describe reviewing the matches.
- Novice observation/retention work is not complete; no recognition improvement, accuracy or mastery is claimed. Real screen readers, physical iPhone/iPad/macOS Safari, enlarged text and device-specific layout remain open checks. DOM tests do not establish sensory learning or native-browser usability.

## Release planning recorded alongside R12

R10 now includes phylloxera, grafting/own-rooted and pre-/post-phylloxera terminology plus one or two documented parcel/bottling examples. This is planned, not implemented in R12. R14 schedules one optional 600–900-word historical production guide with Georgian, Greek and Roman stories after R10. Archaeological evidence, reconstructions and living traditions must remain distinct. Neither introduces a new wine family or score bonus. The remaining sequence is R10 → R14 → R13.
