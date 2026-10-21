# Wine Atlas release plan

Status: R1–R5 complete. R6 and R7 first batches implemented 2026-10-21; later US regions, Okanagan and Eiswein remain open candidates. R8 implemented 2026-10-21: guided tasting flights and worksheet. R9–R10 remain planned: a beginner journey and bottle-label guidance. Browser/device verification limits are recorded below.
Created: 2026-10-19.  
Review baseline: main at `d819d99505b188f2319c37f0f4aa01153278438b` (120 profiles, 92 region entries, 47 grape/blend baselines).  
Release IDs below are planning identifiers, not published semantic versions.

## Priorities and sequencing

Fix misleading behavior and content before increasing the catalog. Preserve the static, curated reference model and existing canonical profile links wherever practical.

| Order | Release | Priority | Main outcome | Depends on |
| --- | --- | --- | --- | --- |
| R1 | Search with Meaning | P1 — high | Wine styles and qualified queries return relevant results | None |
| R2 | Find Your Place | P2 — medium | Predictable navigation, accessible focus and readable detail layouts | None; scheduled after R1 |
| R3 | Profiles You Can Trust | P2 — medium | Explicit modeled expressions, credible guidance and traceable evidence | R1/R2 for final integrated checks |
| R4 | Honest Discovery | P2 — medium | Recommendations explain meaningful similarities and contrasts | R3 |
| R5 | Familiar Names, Better Coverage | P3 — low | Close prominent grape, appellation and wine-style gaps in small batches | R1–R4 |
| R6 | America Beyond California | P3 — low | Focused US regions outside California, including smaller AVAs | R1–R4; normally follows R5's first batch |
| R7 | Canada: Frozen on the Vine | P3 — low | Canadian icewine with accurate production and comparison context | R1–R4; normally follows R6's first batch |
| R8 | Taste the Difference | P2 — medium | Six guided tasting flights connected to Compare | R1–R4; uses existing R5–R7 profiles |
| R9 | Your First Glass | P2 — medium | Short practical beginner journey with clear next steps | R8 for guided-flight integration |
| R10 | From Atlas to Bottle | P2 — medium | Recognize modeled expressions on labels and wine lists | R8/R9 for integrated learning and buying cues |

R5–R7 are independent content programs once the quality foundation is complete. Their first batches follow the order above; remaining candidates can be reprioritized without delaying bug fixes. R8–R10 form the learning-focused feature sequence, ahead of remaining content expansion candidates. Prefer helping users apply existing coverage before increasing profile counts. Continue the R3 evidence-review backlog and outstanding Safari/touch verification alongside this work; these are existing quality obligations, not newly discovered regressions. No target dates are assigned.

## Working rules for every release

- Reproduce each relevant finding against the then-current main branch before implementing a fix; another change may already have addressed it.
- Keep scope small enough to review. Do not combine every expansion candidate into one large data update.
- Retain one shared profile computation, search engine and comparison model. Prefer existing data contracts to parallel implementations.
- Keep canonical grape IDs stable when adding synonyms. Model distinct expressions without silently breaking shared URLs; document any required migration or redirect.
- Use structured semantics for colour, sweetness, production and blend identity. Avoid inferring them from tasting prose.
- Preserve the existing cautious soil/terroir language. Do not imply literal transfer of rock or nearby-plant flavours into wine.
- Keep optional winemaking and maturity sections selective; missing useful evidence is a reason to omit a section, not fill it with boilerplate.
- Run the existing `npm run validate` checks and add regression coverage for the behavior being changed. UI releases also need real-browser checks; jsdom cannot validate layout, scrolling or Safari behavior.
- Check iPhone and iPad Safari as well as desktop Chrome, keyboard navigation and touch use. Record untested environments honestly.
- A release is complete only when its acceptance criteria and applicable checks pass. Completed release tasks are checked below; later releases remain unchecked.

## R1 — Search with Meaning

**Goal:** A request for a wine style should search wine attributes; an aroma query should search aromas.

**Review findings:** F01, F02, F06.

**Likely files:** `wine-search.js`, `data/wine-search.json`, `data/grapes.json`, `search-enhance.js`, `compare-discovery.js`, relevant tests and validators.

Implementation notes: see [Search semantics](docs/search-semantics.md). The R1 changes add search semantics and evidence-backed aliases; they do not add regions or change wine scores.

Validation: the full automated validation/regression suite covers the R1 acceptance criteria. iPhone/iPad Safari and physical touch-device checks remain unverified in this environment; they are not claimed as passed.

### Scope

- [x] Recognize rosé, orange/amber, red, white, sweet, dry, sparkling and fortified as structured search intents, with an explicit policy for ambiguous words such as rose/orange.
- [x] Keep sensory searches possible through an explicit aroma context or a clearly distinguished fallback. Rose-petal notes must not masquerade as rosé wine.
- [x] Combine family, colour, sweetness, grape, place and food constraints consistently. Structured qualifiers must remain available after an appellation or family rule consumes part of a query.
- [x] Use boundary-aware matching for identity terms rather than incidental substrings in unrelated prose.
- [x] Add a maintainable synonym mechanism. Initial aliases include Spätburgunder/Spaetburgunder for Pinot Noir, Primitivo for Zinfandel and Alvarinho for Albariño. Verify and document synonyms before adding them.
- [x] Separate grape identity from regional coverage: recognizing Primitivo does not imply that Puglia is already represented.
- [x] Review the broad `moscato` alias, currently restricted to Moscato d'Asti, so generic grape searches do not accidentally hide other represented Muscat expressions.
- [x] Keep Explore and Compare on the same semantics and retain accent-insensitive matching.

### Acceptance criteria

- [x] `rosé` excludes still Gewürztraminer; `white` excludes still red Burgundy Pinot Noir.
- [x] `sweet` does not include a dry wine merely because its prose says “sweet oak”.
- [x] `orange wine` finds skin-contact wines without matching dessert wines solely for orange-fruit notes.
- [x] `sparkling dry` finds appropriate dry sparkling profiles; `sparkling sweet` finds Moscato d'Asti.
- [x] Existing Champagne, crémant, Cava and Prosecco constraints and food aliases remain correct.
- [x] Synonym queries resolve the intended existing grape identities and honestly expose regional coverage limits.
- [x] Equivalent queries produce consistent candidates in Explore and Compare.

## R2 — Find Your Place

**Goal:** Every view transition leaves users oriented, including on smaller screens and with a keyboard.

**Review findings:** F03, F04, F05, F09.

**Likely files:** `app.js`, `ux.js`, `gallery.js`, `advanced-compare.js`, `compare-state.js`, `functional.js`, `styles.css`, `ux.css`.

Implementation notes: see [Navigation and history](docs/navigation.md). Automated regression tests cover view restoration, legacy links, comparison validation, focus, and status messages. Desktop Chrome checks cover layout and navigation; iPhone/iPad Safari and physical touch-device checks remain unverified.

### Scope

- [x] Fix gallery-to-profile scroll behavior. Bring the new profile heading into view and give keyboard/screen-reader users a meaningful focus destination.
- [x] Apply an explicit scroll/focus policy to recommendation, search and comparison transitions. Preserve expected browser Back/Forward restoration.
- [x] Fix the identity/production definition-list grid to match the renderer's actual row wrappers. Verify long descriptions and narrow screens.
- [x] Represent Gallery and Compare in navigable state. Restore the visible view and valid comparison selections after refresh and Back/Forward; provide a shareable comparison URL.
- [x] Keep existing `?grape=...&region=...` links working and validate unknown, duplicate or incompatible comparison keys.
- [x] Ensure live-status messages describe the visible selection rather than an earlier empty state.
- [x] Add a user-facing label for `white-gold` and check every allowed colour value has a consistent display label.

### Acceptance criteria

- [x] Gallery → USA → Napa Cabernet opens at the profile heading, not near the footer; focus is not abandoned on a hidden card or document body.
- [x] Regional identity and production fields remain readable at phone, tablet and desktop widths, without alternating 84/96-pixel content columns.
- [x] Profile → Gallery → another profile → Back returns to Gallery with useful position restoration.
- [x] A comparison can be refreshed/shared and restored without silently reverting to a previous Explore profile.
- [x] Remove controls and subsequent keyboard actions retain useful focus.
- [x] Sweet white profiles display a readable colour label rather than `white-gold`.

## R3 — Profiles You Can Trust

**Goal:** Make clear what each profile represents, what the guidance means and which evidence supports it.

**Review findings:** F08, F10, F11, F12, F13, F14.

**Likely files:** `data/regions.json`, `data/grapes.json`, `data/sources.json`, `data/taste-basics.json`, `data/maturity.json`, `scripts/validate.py`, `scripts/content_audit.py`, source rendering and documentation.

Implementation notes: see [Modeled expressions and evidence](docs/profile-methodology.md) and the [prioritized evidence audit](docs/evidence-audit.md). R3 names all 120 modeled expressions while preserving existing scores and IDs. It addresses the priority factual conflicts with 16 reviewed targeted references; 59 legacy records remain background leads pending claim-level metadata review, with gaps explicitly recorded for every profile. Missing book editions/pages remain flagged rather than invented.

Validation: full automated regression/data checks, including expression and evidence-contract fixtures. Deployed desktop Chrome smoke checks cover expression labels, linked styles, sources and comparison context. iPhone/iPad Safari and physical touch-device checks remain unverified.

### Scope

- [x] Give each profile an explicit modeled expression. Initial corrections: Vouvray's selected sweetness/style, dry Tokaj Furmint and white-vinified Kakheti Rkatsiteli.
- [x] Align scores, expectation copy, production metadata, serving advice and comparison context. Link to separately represented amber/sweet expressions where useful.
- [x] Identify representative blends clearly: review Cabernet-led and Merlot-led Bordeaux, Grenache-led Southern Rhône and the represented Cava expression. Distinguish a grape-led reference from a guaranteed monovarietal bottle.
- [x] Review ageing ranges, starting with Bordeaux and Burgundy. Distinguish ordinary regional examples from selected ageworthy wines, and specify whether time is from vintage, bottling or release as appropriate.
- [x] Make storage and producer/vintage dependence clear where they change the advice. Review decanting guidance for young versus fragile mature examples.
- [x] Replace the blocking “identical scores for the same grape” rule with an advisory editorial check. Retain blocking checks for invalid metrics, broken references and other genuine data-contract failures.
- [x] Document editorial scores as approximate typical-style judgments. Do not introduce unsupported numeric differences solely to make Compare look more informative.
- [x] Correct the beginner explainer: common second-fermentation methods are not universal; Moscato d'Asti uses an interrupted single fermentation. Include direct pressing alongside short skin contact for rosé.
- [x] Improve source records with specific pages/technical sheets, publisher or authority, access/review dates, and book edition/chapter/page details where available.
- [x] Associate evidence with modeled expressions or claim groups, particularly production, ageing and factual regional claims. Separate editorial score judgments from factual citations.
- [x] Audit existing references in risk order. The review found 38 of 56 URLs pointed to website roots; this is an auditability concern, not proof that their claims are false.
- [x] Provide understandable methodology/source presentation without making the main profile hard to read.

### Acceptance criteria

- [x] A reader can identify the modeled sweetness, colour, production style and blend status without reconciling contradictory sections.
- [x] Kakheti's white reference no longer describes its low-tannin score as representing amber skin-contact wine.
- [x] Broad Bordeaux/Burgundy profiles do not imply all bottles warrant premium-wine cellaring windows.
- [x] Identical rounded scores are allowed when evidence and other content justify the profiles.
- [x] The beginner guide agrees with the app's Moscato and rosé production entries.
- [x] High-risk factual claims have usable supporting references; remaining evidence gaps are tracked explicitly.
- [x] Revised labels/data preserve existing links or provide a documented compatibility path.

## R4 — Honest Discovery

**Goal:** Recommendations should explain either a real similarity or a deliberate contrast.

**Review finding:** F07.

**Likely files:** `smart-discovery.js`, `wine-model.js`, comparison presentation, structured metadata if justified, regression tests.

Implementation notes: see [Honest Discovery](docs/discovery-methodology.md). Close routes now require matching selected style semantics and a documented structural threshold. Sparse catalogs can show fewer cards or explicit contrasts. No regions, profile IDs, metric scores or broad comparison rules change; the R3 evidence backlog remains open.

Validation: full automated regression suite, including threshold boundaries, sparse fixtures, explanation checks and catalog-wide invariants. Deployed desktop Chrome smoke checks cover Moscato and Pinot Noir contrasts, coverage labels, profile navigation and comparison context. iPhone/iPad Safari and physical touch-device checks remain unverified.

### Scope

- [x] Evaluate sweetness, production method and pressure/style where meaningful in addition to broad family and numeric distance.
- [x] Keep “can be compared” separate from “is a close substitute”. Broad comparison families may remain useful for learning.
- [x] Define a defensible similarity threshold; do not force three similar recommendations when no convincing candidates exist.
- [x] Present fewer recommendations or label a contrast explicitly when the catalog is sparse.
- [x] Replace generic “comparable production context” copy with the actual common ground and material differences.
- [x] Check that “same grape, different place” does not conceal a major change in colour or production.
- [x] Verify “adventurous” reflects a meaningful discovery rather than automatically treating every native grape as unusual.

### Acceptance criteria

- [x] Moscato d'Asti → dry Cava/Prosecco is explained as a contrast where appropriate, not an interchangeable sweetness/production match.
- [x] Pinot Noir blanc de noirs → Pinot Noir sparkling rosé acknowledges colour/production differences.
- [x] Similarity reasons mention useful shared characteristics rather than only incidental zero scores.
- [x] Sparse families remain honest about the number and strength of available recommendations.

## R5 — Familiar Names, Better Coverage

**Goal:** Close prominent gaps in recognizable wines before pursuing completeness.

**Priority:** Low; start after R1–R4. Use multiple small content batches, each normally 4–8 new profiles with its own evidence review.

### Ordered candidate batches

| Batch | Candidates | Main learning value |
| --- | --- | --- |
| A — Familiar regional contrasts | Chablis Chardonnay; Primitivo/Puglia; Corvina-led Valpolicella and Amarone as distinct expressions; Verdejo/Rueda; Pinotage/South Africa | Recognizable labels, varietal synonyms, production-driven differences |
| B — Missing classic families | Sherry/Jerez with selected distinct styles; Madeira with an explicitly selected grape/sweetness style; Vinho Verde with Alvarinho and/or Loureiro | Dry versus sweet fortified wines, oxidative ageing, Atlantic whites |
| C — Broader everyday coverage | Montepulciano/Abruzzo; Nero d'Avola/Sicily; Monastrell/Jumilla; Mencía/Bierzo; white Rioja | High-value gaps in commonly encountered grapes and regions |
| D — Further regional identity | Châteauneuf-du-Pape; Bandol/Mourvèdre; Muscadet/Melon; Torrontés/Argentina; dry Sémillon/Hunter Valley | Regional blends, savoury reds, fresh/aromatic whites and bottle evolution |

### Batch progress

- [x] A — Familiar regional contrasts: six profiles implemented. See [batch notes, sources and validation](docs/familiar-names-batch-a.md).
- [x] B — Missing classic families: five profiles implemented. See [batch notes, sources and validation](docs/classic-families-batch-b.md).
- [x] C — Broader everyday coverage: five profiles implemented. See [batch notes, sources and validation](docs/everyday-coverage-batch-c.md).
- [x] D — Further regional identity: five profiles implemented. See [batch notes, sources and validation](docs/regional-identity-batch-d.md).

Current coverage after R7: 150 profiles, 118 region/style records, 60 grape/blend baselines, 23 countries. All four R5 batches and the R6/R7 first batches are implemented; later content candidates remain subject to evidence and priority.

### Requirements and acceptance criteria

The completed checks below apply to all four implemented R5 batches and should be repeated for future content expansions.

- [x] Confirm the intended appellation/style and evidence before finalizing every candidate. These are a queue, not claims that all regional wines share one style.
- [x] Use proper blend and production modeling; do not present Amarone as generic Corvina or Sherry/Madeira as uniformly sweet.
- [x] Review colour and sweetness compatibility when dry fortified expressions are introduced. Broad educational Compare remains; explicit sweetness/colour/production contrasts and stricter discovery prevent substitute claims.
- [x] Resolve consumer-facing names in search; distinguish an exact represented profile from a broader related regional reference.
- [x] Each profile has sources, a locator, useful pairings, practical serving guidance and a specific reason to exist.
- [x] Expand maturity/winemaking sections only when genuinely useful.
- [x] Recheck search, comparison and discovery after every batch. Update coverage counts in the same content release.


## R6 — America Beyond California

**Goal:** Add focused US appellations outside California, including smaller and less familiar regions. The existing Willamette Valley entry remains; do not count it again as new coverage.

**Priority:** Low. First batch complete: five region entries and six profiles. See [implementation and evidence](docs/america-beyond-california-r6.md). Later candidates remain open.

### First batch

| Region | State(s) | Initial modeled expression | Comparison opportunity |
| --- | --- | --- | --- |
| Red Mountain AVA | Washington | Cabernet Sauvignon | Existing Napa, Bordeaux and Coonawarra profiles |
| Walla Walla Valley AVA | Washington / Oregon | Syrah | Existing Northern Rhône, Barossa and Swartland profiles |
| Finger Lakes AVA | New York | Explicitly dry Riesling | Existing dry Riesling profiles; distinguish the off-dry Mosel reference |
| Monticello AVA | Virginia | Cabernet Franc and Viognier | Chinon and Condrieu respectively |
| Old Mission Peninsula AVA | Michigan | Explicitly dry Riesling | Finger Lakes and other dry Riesling expressions |

These comparisons are editorial questions to investigate, not predetermined numerical differences. Red Mountain and Old Mission provide small-AVA coverage; Finger Lakes and Walla Walla are broader focused regions, not micro-appellations.

### Later candidates, in small batches

- [ ] North Fork of Long Island, New York — Merlot.
- [ ] Snake River Valley, Idaho / Oregon — Syrah; consider Eagle Foothills as a smaller subregion only if the evidence supports a distinct expression.
- [ ] Texas Hill Country — investigate a locally grown Tempranillo expression. Distinguish vineyard/appellation origin from a winery's address; do not treat Texas High Plains fruit as Hill Country fruit.
- [ ] Umpqua Valley / Applegate Valley, Oregon — select an evidence-supported expression that adds value beyond existing Willamette Pinot Noir.
- [ ] Leelanau Peninsula, Michigan — assess whether a second Michigan profile teaches enough to warrant a separate entry.

### First-batch requirements and acceptance criteria

- [x] Verify AVA boundaries, canonical names and grape relevance using regional bodies, official appellation material and representative producer technical sheets.
- [x] Reflect the represented cross-state Walla Walla AVA correctly. Apply the same requirement to Snake River Valley if added later. Avoid labeling the whole appellation as belonging to only one state.
- [x] Keep state names searchable and visible where useful without turning country into inconsistent values such as “USA — Virginia”.
- [x] Do not assign numerical contrasts in advance or generalize an unusually famous producer/subregion to an entire AVA.
- [x] Ensure US discovery has meaningful coverage outside California without duplicating existing entries.
- [x] Apply R3's evidence and expression rules and run all applicable content/search checks.

## R7 — Canada: Frozen on the Vine

**Goal:** Introduce Canadian icewine as a distinct sweet-wine production story.

**Priority:** Low. First batch complete: Niagara Peninsula, Ontario, with Vidal Blanc, Riesling and red Cabernet Franc icewine. See [implementation, sources and validation](docs/canadian-icewine-r7.md).

### Scope

- [x] Add Canada to the existing country/gallery/locator flows through normal data-driven mechanisms.
- [x] Add a properly sourced Vidal/Vidal Blanc grape baseline. Identify it accurately as a hybrid; do not imply it is an indigenous Canadian vinifera variety.
- [x] Add Niagara Vidal icewine and Niagara Riesling icewine as explicitly sweet expressions; optionally add Cabernet Franc icewine with its correct appearance and production context.
- [x] Confirm whether the current one-grape/one-region key can express all selected profiles cleanly. Use explicit expression modeling if necessary rather than overwriting a future dry Niagara profile.
- [x] Explain naturally frozen-on-the-vine grapes and pressing while frozen, concentration, retained sugar and acidity.
- [x] Distinguish Canadian icewine from artificially frozen-grape wines, late-harvest wines, botrytised wines and fortified wines. Verify terminology and requirements against current provincial authorities at implementation.
- [x] Add icewine / ice wine search aliases, glossary/taste-guide context and appropriate serving, dessert/cheese pairing and ageing guidance.
- [x] Compare within the sweet family: highlight freeze concentration versus noble rot or shriveling, rather than describing all sweet wines as equivalent.
- [ ] Consider a later Okanagan Valley, British Columbia, Riesling icewine profile. Reconfirm current regional production and availability before committing; Ontario's rules must not be assumed to apply unchanged in BC.
- [ ] Later optional comparison: German/Austrian Eiswein; not a prerequisite for this Canadian release.

### Acceptance criteria

- [x] Searches for Canada, Canadian icewine, ice wine, Niagara and Vidal find appropriate profiles.
- [x] Scores and wording distinguish icewine from dry Riesling and explain sweetness balanced by acidity.
- [x] No guidance implies fortification, noble rot or artificial freezing is the defining Canadian icewine process.
- [x] Vidal identity, production terminology and province-specific factual claims have direct authoritative sources.
- [x] Colour, comparison compatibility, discovery and glossary behavior work for the new expressions.
- [x] Ageing advice is qualified by grape, producer and storage rather than promising every icewine decades of improvement.

## R8 — Taste the Difference

**Goal:** Turn the existing atlas and Compare into guided tasting experiences for learners and enthusiasts.

**Priority:** P2 — medium. Implementation complete; see [release notes and verification limits](docs/tasting-flights-r8.md). Remaining device/assistive-technology checks are explicitly tracked, not claimed as passed.

**Why:** The catalog already supports useful contrasts, but choosing the wines and knowing what to notice still requires prior knowledge. Curated flights give Compare a concrete purpose and connect reading to tasting.

**Likely files:** A small structured flight dataset (for example `data/tasting-flights.json`), the learning/discovery presentation, `compare-state.js`, `advanced-compare.js`, navigation, validators and focused tests. Reuse the existing profile computation and comparison transaction.

### Scope

- [x] Ship six curated flights using existing profiles, with two or three wines per flight. Each has one learning question, concise context, selection/buying cues, serving order and two or three sensory observations to try.
- [x] Start with the candidate flights below; confirm the actual modeled expressions and evidence before finalizing the teaching claims. Explain that producer, vintage, ripeness and winemaking can confound a regional comparison.
- [x] Offer one-click opening of each flight in Compare through its existing atomic state API. Keep ordinary manual comparison available.
- [x] Make flights discoverable from the learning entry point and relevant profiles, with a useful return route.
- [x] Include a concise printable tasting worksheet: bottle/vintage identification, observations before reading the expected profile, and a reflection on the learning question. This is a worksheet, not a saved tasting notebook or account feature.
- [x] Preserve a shareable route to the flight and its learning context, alongside existing profile and comparison links. Define refresh, Back/Forward and invalid-flight behavior.
- [x] Provide value without purchasing wine: users can read the question and explore the modeled comparison.

### Candidate first flights

| Flight | Existing profile candidates | Learning question |
| --- | --- | --- |
| Sauvignon Blanc, two places | Sancerre and Marlborough | How can the same grape express different fruit and savoury characters? |
| Cabernet across regions | Bordeaux and Napa | What changes in ripeness, structure and blending context? |
| Fresh versus dried grapes | Valpolicella Classico and Amarone | What does grape drying change beyond sweetness? |
| Same grape, different names | Primitivo di Manduria and Lodi Zinfandel | How can shared grape identity coexist with different regional expressions? |
| Sparkling production | Champagne Brut NV and Prosecco | What might lees contact and production method contribute to texture and aroma? |
| Routes to sweetness | Niagara Riesling Icewine, Sauternes and Tokaji Aszú | How do natural freezing and noble rot produce distinct sweet-wine references? |

### Acceptance criteria

- [x] Every flight references valid, distinct profiles that satisfy existing Compare compatibility; unavailable references fail gracefully.
- [x] One action opens exactly the intended two or three wines, with correct labels and production context, without duplicate or stale slots.
- [x] Teaching copy identifies meaningful similarities and contrasts without inventing score differences or claiming a controlled experiment.
- [x] Flight context and selections survive refresh and sharing; Back/Forward restores a useful location and focus.
- [x] The worksheet prints legibly without clipping or depending on dark backgrounds.
- [x] Keyboard navigation, accessible names and focus are covered by regression tests and deployed desktop Chrome checks. Catalog and comparison layouts were visually inspected on desktop.
- [ ] Complete real screen-reader, iPhone/iPad Safari and physical touch checks, including phone/tablet layouts. These environments remain explicitly unverified.
- [x] Run existing validation plus focused dataset, comparison-state and navigation regression checks.

## R9 — Your First Glass

**Goal:** Give beginners a short, practical learning journey before the detailed production guide.

**Priority:** P2 — medium; follows R8 and links into its flights.

**Why:** The current beginner entry opens a substantial reference guide beginning with score methodology. New learners first need words for sensations and a manageable next action.

**Likely files:** `learning.js`, `learning.css`, `ux.js`, `data/taste-basics.json`, glossary data, a small journey dataset if useful, navigation and focused tests.

### Scope

- [ ] Reshape “New to wine?” into a short sequence covering acidity, tannin, body and sweetness, followed by a first guided comparison. Define a clear beginning and end.
- [ ] Explain each concept through observable sensations: mouth-watering acidity, drying tannin, perceived weight/body and residual sweetness. Distinguish fruit aroma from sugar and tannin from acidity.
- [ ] Include brief observation exercises and optional familiar food/drink analogies; allow learning without buying or drinking wine.
- [ ] Use progressive disclosure for score methodology, production detail and technical terms. Preserve access to the full existing taste guide and glossary.
- [ ] Connect each lesson to a relevant existing profile and, where suitable, an R8 flight. Keep one clear next action and allow skipping, returning and restarting.
- [ ] Keep the journey optional: experienced users retain direct access to Explore, Compare and the detailed reference.
- [ ] Reuse existing editorial definitions and profile data; avoid a second scoring system, mandatory quizzes, accounts or persistent learning tracking.

### Acceptance criteria

- [ ] A first-time visitor can identify where to start and finish the core journey without navigating the entire long-form guide.
- [ ] Learners can distinguish dry from fruity, tannin from acidity, and body from quality after reading the relevant explanations.
- [ ] Each lesson supplies a concrete observation and a working next-step link; detailed reference material remains reachable.
- [ ] Closing a glossary/guide or returning from a profile/flight preserves useful lesson context and focus; define refresh and Back/Forward behavior.
- [ ] Content remains readable at phone and tablet widths and at enlarged text settings. Check keyboard, screen-reader, Safari and touch interaction; report any unverified checks.
- [ ] Run existing validation and focused checks for lesson references, progression, skipping and return navigation.

## R10 — From Atlas to Bottle

**Goal:** Help users recognize the modeled expression on a bottle label or restaurant list and understand where that bottle may differ.

**Priority:** P2 — medium; follows R9. Begin with a focused batch rather than mandatory boilerplate across all 150 profiles.

**Why:** A clear editorial profile is useful only if users can connect it to an actual wine. Labels may foreground appellation, grape, production method or sweetness, and those cues do not all guarantee the atlas's typical style.

**Likely files:** Profile rendering, a structured label-guidance dataset or optional profile fields, `data/sources.json`, `learning.js`, validators and focused tests.

### Scope

- [ ] Add an optional “Recognize it on the label” section with common names, useful appellation/grape/style cues, important qualifiers and specific reasons a bottle may differ.
- [ ] Pilot guidance for six learning cases: Chablis Chardonnay; selected Bordeaux Cabernet-led versus Merlot-led references; Valpolicella versus Amarone; Prosecco sweetness wording; selected Sherry styles; and Niagara icewine. Choose exact profile coverage during implementation.
- [ ] Distinguish regulated identity/category terms from sensory clues, marketing language and producer choices. Verify current jurisdiction-specific meanings using authoritative sources.
- [ ] Explain when grape names may be absent, when a regional name covers several styles, and which additional label information is needed to select the represented expression.
- [ ] Cover producer, vintage, cuvée, oak treatment, sweetness and age only where they materially affect the selected example. Do not infer precise blend, ABV, sugar, oak or drinking windows from an appellation alone.
- [ ] Link relevant glossary definitions and explicitly represented alternatives; connect buying cues in R8 flights to this shared guidance.
- [ ] Keep guidance useful for shops and restaurant lists without requiring live inventory, prices, commercial recommendations, label scanning or a backend.
- [ ] Preserve source traceability and reviewed/limited evidence distinctions; leave unsupported fields absent rather than generating generic advice.

### Acceptance criteria

- [ ] Each pilot case explains what to look for, what the cue establishes, what it does not establish and when more information is needed.
- [ ] A user can connect example label wording to the correct represented expression or an explicit coverage limitation.
- [ ] No guide implies that a familiar appellation guarantees one sweetness, blend, oak treatment or exact sensory score.
- [ ] Legal/category claims have direct, dated authoritative references with their jurisdiction and review scope recorded.
- [ ] Shared guidance stays consistent across profiles, flights, glossary and search; existing URLs and search identities remain stable.
- [ ] Optional sections are omitted cleanly when guidance is missing; verify readable mobile layout, accessible disclosure and return focus.
- [ ] Run existing validation and focused checks for guidance references, links, optional rendering and representative ambiguous label cases.

## Review finding traceability

| Finding | Review issue | Planned release |
| --- | --- | --- |
| F01 | Style searches return misleading prose matches | R1 |
| F02 | Qualified queries such as “sparkling dry” return no results | R1 |
| F03 | Gallery-to-profile scroll/focus disorientation | R2 |
| F04 | Definition-list grid mismatch | R2 |
| F05 | Gallery/Compare history, refresh and sharing state | R2 |
| F06 | Missing familiar grape synonyms | R1; regional expressions added in R5 |
| F07 | Recommendations overstate similarity | R4 |
| F08 | Validation requires artificial score uniqueness | R3 |
| F09 | Raw white-gold badge value | R2 |
| F10 | Multiple styles presented through one ambiguous profile | R3 |
| F11 | Overbroad ageing guidance | R3 |
| F12 | Blend-based profiles need clearer identity | R3 |
| F13 | Overly absolute beginner production explanations | R3 |
| F14 | Sources are difficult to audit at claim/expression level | R3 |
| Gaps | Original review's missing grapes, regions and wine families | R5 |
| New request | Smaller US regions outside California | R6 |
| New request | Canadian icewine | R7 |
| Product direction | Guided tasting flights and a printable worksheet | R8 |
| Product direction | Short practical beginner learning journey | R9 |
| Product direction | Connect modeled profiles to bottle labels and wine lists | R10 |

## Research starting points

These are starting references, not approval of every proposed tasting score or regional generalization. Recheck them during implementation and add exact technical evidence for each final expression.

### Corrections and methodology

- [Bordeaux: red-wine styles, serving and ageing](https://www.bordeaux.com/en/choosing-a-wine/red/)
- [Bordeaux: grape varieties and blending](https://www.bordeaux.com/en/grape-varieties/)
- [Consorzio Asti: Moscato d'Asti](https://astidocg.it/en/wines/moscato-dasti-docg/)
- [WSET: Asti production and single fermentation (PDF)](https://www.wsetglobal.com/media/1426/articles-2013_-asti.pdf)
- [Vins de Provence: rosé production](https://www.vinsdeprovence.com/en/le-rose/l-elaboration-du-rose)
- [UC Davis: Zinfandel and Primitivo](https://fps.ucdavis.edu/grapebook/winebook.cfm?chap=Zinfandel)
- [Wines of Germany: Spätburgunder](https://winesofgermany.co.uk/grape/spatburgunder/)

### US regional expansion

- [Washington State Wine Commission: Red Mountain](https://www.washingtonwine.org/resource/red-mountain/)
- [Washington State Wine Commission: AVA boundaries and regional profiles](https://www.washingtonwine.org/regions-and-avas/)
- [New York Wine & Grape Foundation: grape varieties](https://newyorkwines.org/grapes/)
- [Virginia Wine: grape varieties](https://pages.virginiawine.org/varietals/)
- [Virginia tourism: Monticello Wine Trail](https://www.virginia.org/blog/post/charlottesville-wineries/)
- [Michigan tourism: Old Mission Peninsula](https://www.michigan.org/article/trip-idea/things-to-do-old-mission-peninsula-ultimate-pure-michigan-guide)
- [Idaho Wine Commission: regional grape varieties](https://idahowines.org/idahos-top-wine-varietals/)

### Canadian icewine

- [Wine Country Ontario: icewine production](https://winecountryontario.ca/icewine/)
- [Wine Country Ontario: Canadian wine overview (historical PDF)](https://winecountryontario.ca/wp-content/uploads/2019/05/wines_of_canada_brochure_2016.pdf)
- [Wines of British Columbia: historical icewine harvest and production context](https://winebc.com/industry/media_releases/freezing-temperatures-bring-icewine-harvest-to-bc-wineries/)

Consult current provincial appellation/regulatory material for exact icewine requirements. Historical references establish context and must not be used as evidence of current harvest volumes, availability or unchanged regulations.
