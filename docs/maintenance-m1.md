# M1 — R1–R9 maintenance and learning audit

Reviewed 2026-10-21 against main `06ea9f3e3a151e07ce4ae6e5b4f9e1abccd7d0ed`.

## Assessment

The atlas is a useful reference and R9 gives newcomers a readable vocabulary introduction. It is not yet a complete sensory-training course or a blind region-identification tool. Reading a descriptor, recognizing the sensation in a known sample, and inferring an unknown wine's origin are different learning tasks. The current app supports the first and some guided comparison; the latter tasks need deliberate practice and feedback.

The maintenance release fixes reproducible defects and updates the plan. It does not add a tasting simulator, new lessons, a blind mode or a personal tasting notebook.

## Review coverage

| Releases | Code/content/UX reviewed | Result |
| --- | --- | --- |
| R1 search | Structured search, Explore/Compare integration, request rendering and existing semantic regression suites | Search contracts remain covered; overlapping same-query Explore requests can duplicate results and are fixed in M1. |
| R2 navigation/layout | Router/history, focus/disclosures, comparison seeding, responsive CSS and long-name Compare presentation | Explicit empty comparison intent can be overwritten by first-visit seeding; metrics misalign under long headers. Both are maintenance fixes. Physical Safari/touch checks remain open. |
| R3 trust | Expression/score contracts, evidence metadata, guide/glossary definitions and evidence-audit backlog | Editorial scores remain typical-style judgments, not measurements or tasting-test answer keys. Every profile retains evidence limits; 58 background records still await claim-level review. No wholesale factual recertification is claimed. |
| R4 discovery | Shared compatibility model, structural distance and explanation policy | Existing regression checks cover close styles versus contrasts. Discovery is useful exploration, not evidence that one descriptor identifies a region. |
| R5–R7 content | Catalog integrity, source/reference contracts, selected production distinctions and current coverage tests | 150 profiles remain intact. These checks do not independently verify every factual sentence or every linked external source. Prioritize evidence for profiles chosen as teaching examples before turning them into training answers. |
| R8 flights | All six datasets, model transactions, lesson context, worksheet identity exposure and optional loading | Good named comparisons. They expose grape/place, and the worksheet prints identities; they are not blind exercises. No defect is alleged merely because a feature outside their scope is absent. |
| R9 journey | All four lessons, introduction/completion, profile/flight returns, dialog lifecycle and enrichment failure behavior | Core distinctions are useful. It lacks a full tasting procedure, practical intensity calibration and aroma training. Malformed optional glossary entries can reject its loading dependency; fixed in M1. |

The baseline full validation suite passed. Additional targeted reproductions exposed gaps that it did not cover. Static review focused on the runtime/data boundaries, search/comparison state, learning modules, their teaching content and corresponding tests; this is not an exhaustive external verification of the entire wine catalog.

## Reproduced maintenance defects

### M01 — Overlapping Explore searches duplicate results

Two overlapping `renderEnhancedAtlasSearch()` calls for `riesling` each pass the same query-string check. Both append to the container: 20 result buttons instead of the ranked 10. Returning to an earlier query or repeated input events can expose this; it is not dependent on two installed input handlers.

Fix: give each render request a generation and permit only the latest request to publish. Clearing the input invalidates pending output. Regression checks cover concurrent same-query rendering and clear-during-request behavior.

### M02 — An unavailable flight can silently select the last wine

On the first visit to Compare, browse Napa Cabernet and then request an unknown flight. Its explicit empty replacement is followed by automatic first-visit seeding, leaving Napa selected despite the unavailable-flight fallback.

Fix: any explicit comparison transaction, including an empty restore/reset, consumes the initial auto-seed opportunity. Ordinary first-visit Compare can still seed the browsed profile when no explicit transaction has occurred. Regression checks cover unavailable flights after profile browsing and deliberate empty resets. Existing selection/URL suites remain applicable.

### M03 — Malformed optional learning data can strand the journey

A glossary response such as `{ "broken": null }` parses successfully but throws while indexing aliases. R9 waits on that promise and never reaches its loaded state. A taste guide whose `sections` or section bodies have the wrong JSON shape also throws when opened.

Fix: filter unusable glossary records and guide sections/examples before rendering. Retain valid material; offer the existing unavailable message when no usable guide remains. The journey's own observation text and navigation continue without glossary enrichment. New tests cover mixed valid/invalid records, all-invalid enrichment, guide shape failures and usable partial guides. Author-time data validators remain strict.

### M04 — Long comparison headers misalign metric rows

In deployed desktop Chrome, the first metric rows in the Niagara/Sauternes/Aszú flight started at viewport Y positions 505, 455 and 465 pixels. Fixed minimum header space cannot accommodate differing name/composition lengths.

Fix: use supported CSS row subgrids so the four card content rows share their actual heights. Retain existing natural flow as a fallback. Automated DOM tests cannot verify this; deployed browser geometry and visual checks are required after deployment.

## Learning gaps to plan, not disguise as maintenance

| Need | Current limitation | Planned work |
| --- | --- | --- |
| Learn how to taste | R9 explains four concepts but does not walk through preparation, looking, smelling, gentle swirling, sipping, noticing texture/finish and recording an observation. | R11: a repeatable beginner procedure and real observation drills. |
| Recognize tannin and acidity | Imagined lemon/tea analogies explain the words; they do not calibrate how different levels feel in real wines. The first flight is two dry whites, so it is not a tannin lesson. | R11: reviewed contrasting examples, relative comparisons and distinguishable sensations; no invented score targets. |
| Recognize notes | Named fruits and savory descriptors appear, but the learner gets no family-first vocabulary practice or familiar aroma references. | R12: smell references, broad-to-specific description and independent observation before optional cues. |
| Practice without suggestion | Named flights, summaries, scores and worksheets reveal identities/expected impressions. | R13: neutral sample codes, observation before reveal and non-leading prompts in a separate optional practice mode. |
| Infer a region | Climate/style explanations are not unique regional fingerprints; producer, grape, vintage and method can overlap. | R13: bounded candidate sets first, multiple clues, alternatives and confidence; exact-region recognition remains an advanced hypothesis. |
| Connect practice to bottles | Actual wine can diverge from a broad profile; novices need help choosing the intended expression. | Retain R10 and complete it before advanced regional blind practice. |
| Demonstrate learning | There has been no beginner usability/retention study, and finishing R9 measures navigation rather than skill. | R11/R12/R13 include novice observation and practical success criteria. |

## Evidence informing the proposed direction

These are research inputs for the new learning releases, not newly reviewed evidence for all existing profiles. Consult them again during implementation and write original teaching material; do not reproduce proprietary tasting grids or aroma-wheel artwork.

- [WSET, Wine tasting information (2019)](https://www.wsetglobal.com/knowledge-centre/blog/2019/november/how-to-build-your-wine-tasting-skills/): structured observation, sensory calibration, contrasting wines, notes and progression towards more detailed comparisons. Supports the teaching direction, not a promise of identification accuracy.
- [WSET, How to taste wine (2023)](https://www.wsetglobal.com/knowledge-centre/blog/2023/december/19/how-to-taste-wine): practical smelling/swirl/sip technique and the role of aroma perception.
- [UC Davis, Sensory Evaluation of Wine course profile (2016)](https://news.bftv.ucdavis.edu/viticulture-and-enology/course-profile-professor-hildegarde-heymanns-class-sensory-evaluation-wine): reference-aroma work, labeled and coded practice, and matching unknown to known samples. This is an advanced-course example, not a requirement to copy its scale for beginners.
- [UC Davis, Introduction to Sensory Evaluation of Wine](https://continue.cpe.ucdavis.edu/course/introduction-sensory-evaluation-wine): known/blind exercises and descriptive terminology. A course description is not an efficacy study of this app.

The recommendation to use regional hypotheses, alternatives and explicit uncertainty is a design judgment for this atlas, not a validated regional-identification model.

## Verification and boundaries

- Baseline and post-fix `npm run validate`: syntax, blocking data validation, advisory audit and all regression suites, including the new maintenance suite.
- New deterministic checks cover M01–M03. The existing suites cover all six flights, beginner progression, navigation/history, manual and seeded comparisons, special wine families, search semantics and safe rendering.
- Desktop Chrome on the deployed M1 build: all three Routes to sweetness metric rows align at y=517 (before: y=505/455/465); Riesling search renders the expected ten distinct results; Your First Glass opens, advances through acidity to tannin, and restores focus to the glossary trigger after closing its dialog. Main-branch validation and Pages deployment both passed.
- iPhone/iPad Safari, physical touch, real screen readers, mobile/enlarged-text layout and browser-native printing remain unverified. These are inherited gaps, not newly proven regressions or checks passed by jsdom.
- No new profiles, score edits or teaching features ship in M1. Deferred US regions, Okanagan and German/Austrian Eiswein remain separate candidates.
