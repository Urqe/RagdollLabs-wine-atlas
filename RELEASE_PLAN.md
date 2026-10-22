# Wine Atlas release plan

Status: R1–R5 complete. R6 and R7 first batches implemented 2026-10-21; later US regions, Okanagan and Eiswein remain open candidates. R8 implemented 2026-10-21: guided tasting flights and worksheet. R9 implemented 2026-10-21: Your First Glass. M1 maintenance implemented after the R1–R9 audit; verification limits are recorded below. M2 implemented 2026-10-22: scoped landing-heading focus styling for the reported macOS Safari highlight; browser verification limits remain below. R11 implemented 2026-10-22: tasting method and practical contrasts; novice and device trials remain open. R12 implemented 2026-10-22: aroma memory, vocabulary and coded household-reference practice; novice/device trials remain open. R10/R13/R14 remain planned, with label guidance next.
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
| M1 | R1–R9 Maintenance | P2 — medium | Repair reproduced search/comparison/enrichment defects and comparison layout | R1–R9; implemented maintenance release |
| M2 | Focus and browser polish | P2 — medium | Fix the reported macOS Safari landing-heading highlight while preserving accessible navigation | M1; implemented maintenance release |
| R11 | Learn to Taste | P2 — medium | Repeatable tasting procedure and sensory calibration for complete beginners | R8/R9; implemented; practical verification open |
| R12 | Find the Notes | P2 — medium | Aroma references, vocabulary and repeated non-leading practice | R11; implemented; practical verification open |
| R10 | From Atlas to Bottle | P2 — medium | Recognize modeled expressions on labels and wine lists | R8/R9; complete before R13 regional practice |
| R14 | Wine Before the Modern Cellar | P3 — low | Three short historical production stories linked to modern techniques | R10; small optional learning release |
| R13 | Taste Before the Reveal | P2 — medium | Optional blind practice progressing from broad style to regional hypotheses | R11/R12; R10 for regional/bottle-selection work |

R5–R7 are independent content programs once the quality foundation is complete. Their first batches follow the order above; remaining candidates can be reprioritized without delaying bug fixes. R8/R9 introduce the reference and beginner vocabulary. The maintenance audit found additional work is needed to train sensory recognition. M1 is implemented. M2 supplies the focused heading-style correction; the feature sequence remains R11 → R12 → R10 → R14 → R13; IDs are stable planning identifiers, not an obligation to implement in numeric order. R10 is the next feature release. R14 is a compact optional guide after R10, not a catalog expansion. This learning sequence takes priority over remaining catalog expansion candidates. Prefer helping users apply existing coverage before increasing profile counts. Continue the R3 evidence-review backlog and outstanding Safari/touch verification alongside this work; these are existing quality obligations, not newly discovered regressions. No target dates are assigned.

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

**Priority:** P2 — medium. Implementation complete; see [release notes and verification limits](docs/beginner-journey-r9.md). Real-device and assistive-technology checks remain open as recorded below.

**Why:** The current beginner entry opens a substantial reference guide beginning with score methodology. New learners first need words for sensations and a manageable next action.

**Likely files:** `learning.js`, `learning.css`, `ux.js`, `data/taste-basics.json`, glossary data, a small journey dataset if useful, navigation and focused tests.

### Scope

- [x] Reshape “New to wine?” into a short sequence covering acidity, tannin, body and sweetness, followed by a first guided comparison. Define a clear beginning and end.
- [x] Explain each concept through observable sensations: mouth-watering acidity, drying tannin, perceived weight/body and residual sweetness. Distinguish fruit aroma from sugar and tannin from acidity.
- [x] Include brief observation exercises and optional familiar food/drink analogies; allow learning without buying or drinking wine.
- [x] Use progressive disclosure for score methodology, production detail and technical terms. Preserve access to the full existing taste guide and glossary.
- [x] Connect each lesson to a relevant existing profile and, where suitable, an R8 flight. Keep one clear next action and allow skipping, returning and restarting.
- [x] Keep the journey optional: experienced users retain direct access to Explore, Compare and the detailed reference.
- [x] Reuse existing editorial definitions and profile data; avoid a second scoring system, mandatory quizzes, accounts or persistent learning tracking.

### Acceptance criteria

- [x] A first-time visitor can identify where to start and finish the core journey without navigating the entire long-form guide.
- [x] Learners can distinguish dry from fruity, tannin from acidity, and body from quality after reading the relevant explanations.
- [x] Each lesson supplies a concrete observation and a working next-step link; detailed reference material remains reachable.
- [x] Closing a glossary/guide or returning from a profile/flight preserves useful lesson context and focus; define refresh and Back/Forward behavior.
- [x] Deployed desktop Chrome checks cover all four lessons, optional reference dialogs, keyboard focus, profile Back, the flight/Compare handoff, refresh, finish and restart. Intro and lesson layouts were visually inspected on desktop.
- [ ] Complete phone/tablet, enlarged-text, Safari, physical touch and real screen-reader checks. These environments remain explicitly unverified.
- [x] Run existing validation and focused checks for lesson references, progression, skipping and return navigation.

## M1 — R1–R9 Maintenance

**Goal:** Preserve the existing learning/reference experience while fixing reproducible maintenance defects and planning the remaining beginner-training work.

**Scope boundary:** This release is maintenance and planning. It does not implement R10–R13, new wine profiles, blind exercises or personal tasting records. See the [code, content and UX audit](docs/maintenance-m1.md).

### Repairs and checks

- [x] Reproduce and fix overlapping same-query Explore requests appending duplicate result buttons.
- [x] Respect explicit empty comparison transactions, including unavailable-flight fallback after browsing a profile; do not silently auto-seed the previous wine.
- [x] Keep malformed optional glossary/guide records from rejecting the beginner loading path or crashing reference dialogs. Retain usable entries and fail softly when no guide remains.
- [x] Replace guessed comparison-header height with progressive CSS row alignment where supported, retaining natural flow as fallback.
- [x] Add regression coverage for the reproduced state/loading/rendering failures and run the complete validation suite.
- [x] Confirm deployed desktop comparison alignment, search and beginner navigation after deployment (Chrome: aligned sweet-flight metric rows, ten Riesling results, acidity → glossary → return → tannin).
- [ ] Complete the inherited Safari/touch, real-screen-reader and mobile/enlarged-text checks; record untested environments honestly.

### Review outcome

R8's named comparisons and R9's four vocabulary lessons remain useful. They do not yet teach a complete tasting procedure, practical intensity calibration, aroma-reference recognition or blind regional inference. Existing worksheets print identities and must not be advertised as blind practice. R11–R13 below address those gaps. Region recognition is an advanced, uncertain inference; the app must never promise mastery after reading a short guide.

## M2 — Focus and browser polish

**Status:** Implemented 2026-10-22. Reported macOS Safari appearance still needs confirmation on that browser. See [implementation and verification](docs/maintenance-m2.md).

**Goal:** Remove the distracting landing-title highlight reported on macOS Safari while preserving useful keyboard focus and accessible route orientation.

### Safari landing-title highlight

- [ ] Reproduce the user-reported blue outline around the full two-line “RagDollLabs Wine Atlas” landing heading on fresh load in macOS Safari. The supplied screenshot establishes the visible symptom; the exact Safari version/settings and cause still need confirmation.
- [x] Investigate `WineNavigation.destination()` / `orient()` / startup restoration, which target `#welcomeTitle`, set `tabIndex=-1` and call `focus()`. The existing pointer-return handling in `home-brand.js` may not cover initial route orientation. Startup route orientation does focus this non-interactive heading. Native Safari painting remains unverified here.
- [x] Apply the smallest appropriate startup-focus or heading-style correction so the landing page opens without a large decorative-looking blue frame. Scope any outline styling to non-interactive route headings as justified; never disable outlines globally, blur every control or remove navigation focus indiscriminately.
- [x] Preserve existing control focus styling, route-heading focus targets and history/focus restoration in code. The only new selector is `#welcomeTitle:focus`; interactive controls and navigation behavior are untouched. Assistive-technology testing remains open below.

### Acceptance and verification

- [ ] Check fresh load, refresh, direct home URL, pointer return via branding, keyboard return and Back/Forward on macOS Safari; record browser/OS settings and results.
- [ ] Confirm that Tab/Shift+Tab still visibly identifies actionable controls, including branding links, and that screen-reader route orientation remains useful. Check other route headings for the same oversized-ring symptom.
- [ ] Recheck desktop Chrome and the existing navigation/focus regression suite. Extend behavioral tests only if the focus contract changes; DOM tests do not establish Safari’s painted appearance.
- [ ] Verify iPhone/iPad Safari separately if shared focus styling changes. Keep the inherited physical-touch, real-screen-reader and enlarged-text obligations open until actually checked.

This is a newly reported macOS Safari visual issue. It does not close or replace M1’s older unverified device checks. M2 scopes `outline: none` to the focused, non-interactive landing heading; it does not change route focus or other heading styles.

## R10 — From Atlas to Bottle

**Goal:** Help users recognize the modeled expression on a bottle label or restaurant list and understand where that bottle may differ.

**Priority:** P2 — medium; execute after R11/R12 and before R13 regional practice. Begin with a focused batch rather than mandatory boilerplate across all 150 profiles.

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

### Phylloxera and vineyard terminology

- [ ] Add connected glossary entries for phylloxera, grafted/ungrafted/own-rooted vines, and pre-/post-phylloxera terminology. Explain susceptible roots and resistant/tolerant rootstocks using authoritative viticulture sources; grafting does not mean the wine is a blend of rootstock and fruiting varieties.
- [ ] Distinguish wine actually made before a local outbreak, vines demonstrably surviving from that period, and modern wine from ungrafted vines. Ungrafted does not establish vine age; there is no single worldwide pre-/post-phylloxera cutoff. Check what a producer means rather than treating the phrase as a universal classification.
- [ ] Add one or two concise “Why this vineyard matters” examples attached to documented parcels/bottlings, such as Quinta do Noval Nacional or Bollinger Vieilles Vignes Françaises after current claim review. Do not label a whole region phylloxera-free from one surviving parcel.
- [ ] Keep the atlas’s style model unchanged: no pre-phylloxera wine family, automatic quality bonus, purity claim or promised universal flavour fingerprint. Teach why the distinction matters to history and vineyard practice, and what it cannot establish about taste.

### Acceptance criteria

- [ ] Each pilot case explains what to look for, what the cue establishes, what it does not establish and when more information is needed.
- [ ] A user can connect example label wording to the correct represented expression or an explicit coverage limitation.
- [ ] No guide implies that a familiar appellation guarantees one sweetness, blend, oak treatment or exact sensory score.
- [ ] Legal/category claims have direct, dated authoritative references with their jurisdiction and review scope recorded.
- [ ] Shared guidance stays consistent across profiles, flights, glossary and search; existing URLs and search identities remain stable.
- [ ] Optional sections are omitted cleanly when guidance is missing; verify readable mobile layout, accessible disclosure and return focus.
- [ ] Run existing validation and focused checks for guidance references, links, optional rendering and representative ambiguous label cases.

## R11 — Learn to Taste

**Goal:** Help a complete beginner perform a repeatable tasting and distinguish what they physically notice.

**Status:** Implemented 2026-10-22 as an extension of R9. See [implementation, teaching sources and verification limits](docs/learn-to-taste-r11.md). R12 extends aroma recognition; novice observation and physical-device checks below remain open.

### Scope

- [x] Lead learning copy with what to expect, what to notice and how to connect familiar sensations to words. Keep review backlogs and internal evidence status in methodology/developer documentation; retain useful bottle variation and uncertainty in plain language. Audit the guide, profiles and flights for process-heavy copy.
- [x] Explain smell versus basic taste versus mouthfeel. Use gums/inner cheeks for noticing tannic grip and the mouth-watering response for acidity; do not teach exclusive tongue zones or assign fruit aromas to locations on the tongue.

- [x] Add a short practical procedure: prepare similar glasses/conditions, look, smell before and after gentle swirling, take a small sip, notice mouth-watering/drying/weight/sweetness and finish, then record an observation before reading suggested notes.
- [x] Explain the difference between aroma/flavour, sweetness, bitterness, astringency and alcohol warmth in plain language. Keep quality preference separate from sensory description.
- [x] Make tannin recognition a real exercise: use familiar tea texture as an optional reference, then a sourced low-/higher-tannin red-wine contrast. Add separate acidity and body contrasts; do not use two whites as evidence of learning red-wine tannin.
- [x] Choose a small, accessible set of existing profiles/bottle styles after reviewing their teaching claims and expression evidence. Give selection and substitution cues so an unsuitable sweet/oaked/mature bottle does not invalidate the lesson silently.
- [x] Teach relative low/medium/high observations using real reference comparisons. Do not require learners to match the atlas's editorial half-point scores or treat its alcohol/sugar anchors as measured calibration standards.
- [x] Keep theory available without wine, but explicitly distinguish reading or imagined analogies from practical recognition. Allow small pours, spitting and stopping without a drinking-volume or session-frequency target.
- [x] Preserve skipping, restarting, accessible controls and useful return context. No mandatory quiz, account or persistent tasting notebook.

### Acceptance criteria

- [x] Implement the complete physical tasting sequence and an independent note field before suggested descriptors. First-time usability still requires the novice observation trial below.
- [x] The practical exercises explicitly distinguish tannin's drying/grip from acidity's mouth-watering response, bitterness and sweetness; body is not presented as quality.
- [x] Every contrast has appropriate reviewed expression evidence, bottle-selection cues and named confounding factors; no artificial score differences are introduced.
- [ ] Observe novice users completing the procedure and explaining the distinctions. Record difficulties and limits instead of equating a Finish click or DOM test with skill acquisition.
- [x] Deployed desktop Chrome: entry/method/progression, independent notes, optional guidance, practice-profile return and retained notes checked; desktop layout inspected. Method-step status label corrected with a regression check.
- [ ] Complete manual phone/tablet, enlarged-text, screen-reader and physical Safari/touch checks. Automated reference/navigation contracts pass; deployed Chrome checks are recorded separately and do not replace these trials.

## R12 — Find the Notes

**Goal:** Build aroma recognition and useful vocabulary through familiar references and practice, not suggestion alone.

**Status:** Implemented 2026-10-22. See [implementation, sources and verification](docs/find-the-notes-r12.md).

**Depends on:** R11. Retain and reuse the existing profile note data where appropriate; review terminology and supporting teaching sources before expanding it.

### Scope

- [x] Teach a broad-to-specific sequence: fruity/floral/herbal/spicy/toasty/earthy or another defensible family, then a familiar example such as citrus or red berries, then a more precise descriptor only when useful.
- [x] Add a small original set of familiar food/aroma reference exercises with clear preparation/smelling instructions. Teach orthonasal smelling and retronasal flavour perception in beginner language.
- [x] Explain that a tasting descriptor is an association, not proof of an added ingredient or literal soil transfer. Allow unfamiliarity with a reference, different cultural vocabularies, individual sensitivity and “I cannot identify it yet”.
- [x] Ask for independent observations before offering optional vocabulary or the atlas's expected notes. Use labeled reference practice first, then optional coded matching and repeat sessions with actual examples.
- [x] Make feedback describe the overlap and differences without declaring a person's perception wrong because it differs from a modeled profile. Feedback on reference matching must use the actual sample identity, not an editorial score.
- [x] Author original material with usable references. Do not copy proprietary aroma-wheel artwork, tasting grids or certification content without permission.

### Acceptance criteria

- [x] Offer broad families, optional finer vocabulary and an independent observation field; users can use their own words or remain uncertain. Actual novice usability remains to be assessed below.
- [x] Expected notes are not the first thing shown in a practice exercise, and actual reference identity is revealed only at the intended feedback step.
- [ ] Repeatability and vocabulary usefulness are assessed in a small novice observation exercise; difficulty and individual differences are documented. Do not invent improvement percentages.
- [x] Deployed desktop Chrome: observation/vocabulary, partner setup, neutral matching, navigation without reveal, recorded-identity feedback and reset checked. Keyboard focus and desktop layout inspected.
- [ ] Complete manual phone/tablet, enlarged-text, keyboard/screen-reader and Safari/touch checks across setup, matching and reveal. Automated glossary/search/profile and learning contracts pass; record deployed Chrome checks separately.

## R14 — Wine Before the Modern Cellar

**Status:** Planned. Small optional learning release after R10; retain stable numbering. Follow with R13 blind practice. No dates assigned.

**Goal:** Explain historical production through techniques that help wine lovers understand today’s bottles, without adding a historical-wine database.

### Scope

- [ ] Create one optional guide of approximately 600–900 words, with three compact stories: Georgia, ancient Greece and Rome. For each use “what they did → why → what differs today → what survives”. Keep dates/regions specific; none is a single uniform ancient method.
- [ ] Georgian story: distinguish archaeological evidence for early grape wine from documented later/living qvevri traditions. Explain clay vessels and skin contact with regional variation; do not claim an unchanged recipe over millennia or equate every qvevri wine with amber wine.
- [ ] Greek story: review evidence for making, storage, transport, preservation and serving practices in a defined period. Discuss resin/amphorae where supported; distinguish drinking customs from fermentation and avoid presenting every Greek wine as resinated or sweet.
- [ ] Roman story: pressing, large fermentation/storage vessels such as dolia, and production/distribution. Separate archaeological/textual findings from experimental reconstructions or inferred sensory possibilities. Do not claim that a modern clay wine reproduces one definitive Roman taste.
- [ ] Link relevant existing glossary terms (qvevri, amphora, skin contact, oxidation and grafting/phylloxera as appropriate) and Georgian profiles. Place the guide in optional learning/reference material, outside the primary tasting sequence. Add glossary terms only when needed for the guide.
- [ ] Use archaeology publications, museum/university research, documented primary texts and living-tradition sources with dated review scope. Preserve the distinction between evidence and interpretation in ordinary language. Do not copy proprietary maps, artwork or book passages.

### Acceptance and boundaries

- [ ] Each story connects a historical practice to a useful modern production concept without a simplistic ancient-bad/modern-good or ancient-pure/modern-artificial progression.
- [ ] The guide stays within the compact scope: no new historical profiles, fabricated tasting scores, comprehensive timeline, producer catalog or promised ancient flavour recreation.
- [ ] Readers can open and leave the guide with accessible controls and useful return context; check links, phone/tablet readability, keyboard, screen readers and physical Safari/touch, recording unverified environments honestly.

## R13 — Taste Before the Reveal

**Goal:** Provide optional blind practice that rewards observation and reasoned hypotheses, with regional recognition as an advanced stretch goal.

**Depends on:** R11/R12. Complete R10 and review selected teaching profiles before using regional/bottle-selection challenges as answer material.

### Scope

- [ ] Separate Learn (identities visible), Practice (cues optional) and Blind (sample identities withheld) with clear labels. Reuse the existing catalog/model; do not relabel the current named flights as blind.
- [ ] Give a host/self-setup workflow for real bottles: neutral A/B/C codes, concealed labels, recorded actual bottle/vintage and an explicit reveal. Explain that an app cannot taste or verify the bottle in front of the learner.
- [ ] Offer a neutral observation sheet and screen. Withhold grape/place/expected notes from normal pre-reveal titles, links, URLs, accessibility labels and printed output. Use a neutral challenge route; hiding identities is a teaching aid, not anti-cheat security for public static data.
- [ ] Progress from broad structural/style contrasts and known references to a small announced candidate set; then consider grape/style hypotheses and finally region. Open-ended exact-region guesses are optional advanced practice.
- [ ] Ask for several observed clues, at least one plausible alternative and confidence. Permit insufficient evidence; never map one fruit note, a soil descriptor or an editorial score directly to a region.
- [ ] Reveal the actual selected bottle information and explain compatible/conflicting clues, overlap, confounders and uncertainty. Distinguish a correct closed-set guess from evidence of general regional mastery.
- [ ] Keep participation optional and notes ephemeral/printable by default. Do not add accounts, hidden telemetry, mandatory rankings or a persistent personal notebook under this scope.

### Acceptance criteria

- [ ] A partner can set up a genuine blind sample; a learner can record observations before identity/expected notes are exposed, then reveal and review the actual sample information.
- [ ] Regression/accessibility/print checks catch accidental pre-reveal identity leakage, premature reveal on navigation, and incorrect sample-to-answer mapping after refresh or reorder.
- [ ] Regional practice uses a defined reviewed candidate set, multiple clues, alternatives and uncertainty. No region-identification accuracy or completion guarantee is claimed without evidence.
- [ ] A novice usability trial checks setup, observation, reveal and feedback separately from knowledge questions. Physical iPhone/iPad Safari, keyboard, screen readers and enlarged text are checked and unresolved issues remain explicit.

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
| Maintenance | Search race, empty comparison intent, malformed learning enrichment and metric-row alignment | M1 |
| Learning audit | Practical tasting technique and sensory calibration | R11 |
| Learning audit | Aroma references, vocabulary and non-leading practice | R12 |
| Learning audit | Blind sample setup, reveal and cautious regional hypotheses | R13 |

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
