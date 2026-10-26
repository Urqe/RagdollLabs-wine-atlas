Warning: truncated output (original token count: 18762)
Total output lines: 697

# Wine Atlas release plan

Status: R1–R5 complete. R6 and R7 first batches implemented 2026-10-21; later US regions, Okanagan and Eiswein remain open candidates. R8 implemented 2026-10-21: guided tasting flights and worksheet. R9 implemented 2026-10-21: Your First Glass. M1 maintenance implemented after the R1–R9 audit; verification limits are recorded below. M2 implemented 2026-10-22: scoped landing-heading focus styling for the reported macOS Safari highlight; browser verification limits remain below. R11 implemented 2026-10-22: tasting method and practical contrasts; novice and device trials remain open. R12 implemented 2026-10-22: aroma memory, vocabulary and coded household-reference practice; novice/device trials remain open. M3 implemented 2026-10-22: Compare search race and optional-route loading focus/URL fixes. R10 implemented 2026-10-22 as a focused label-reading and vineyard-terminology pilot; R14 implemented 2026-10-25 as an optional historical production guide; R13 implemented 2026-10-25 as optional real-bottle blind practice; novice/device verification remains open. R15 three-region weather pilot implemented 2026-10-25; wider coverage and device review remain open. R16 data feed remains a no-go; R17 has five checked-link batches covering 35 profiles as of 2026-10-26, with broader mapping open.
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
| M3 | R12 code maintenance | P2 — medium | Fix asynchronous Compare search ordering and optional-route loading orientation | R12; implemented maintenance release |
| R10 | From Atlas to Bottle | P2 — medium | Recognize modeled expressions on labels and wine lists | R8/R9; implemented; device checks open |
| R14 | Wine Before the Modern Cellar | P3 — low | Three short historical production stories linked to modern techniques | R10; small optional learning release |
| R13 | Taste Before the Reveal | P2 — medium | Optional blind practice progressing from broad style to regional hypotheses | R11/R12; R10 for regional/bottle-selection work |
| R15 | Vintage Weather Intelligence | P2 — medium | Regional vintage-weather interpretation for represented styles, independent of retailers | Existing profile geography; historical weather source; **no Alko dependency** |
| R16 | Alko Data Feasibility Gate | P1 — research | Decide whether Alko product, price and stock **data** may be pulled; provisional no-go 2026-10-25 | External Alko permission; **gates only a data feed, not R17 links** |
| R17 | Search at Alko Links | P2 — medium | Plain links from profiles to Alko's own grape/country/region search; no Alko data stored, no price or stock claims | Existing profile data; link patterns observed 2026-10-25; **no R16 dependency** |
| R18 | ~~Alko Catalog Coverage & Store Selector~~ | — | **Superseded by R17 (2026-10-25).** Reopen only if Alko grants a data route per R16 | — |
| R19 | ~~Guarded Alko Auto-Publishing~~ | — | **Superseded by R17 (2026-10-25).** Reopen only after a permitted data feed exists | — |

R5–R7 are independent content programs once the quality foundation is complete. Their first batches follow the order above; remaining candidates can be reprioritized without delaying bug fixes. R8/R9 introduce the reference and beginner vocabulary. The maintenance audit found additional work is needed to train sensory recognition. M1–M3 are implemented. The feature sequence remains R11 → R12 → R10 → R14 → R13; IDs are stable planning identifiers, not an obligation to implement in numeric order. R10 and R14 are implemented. R13 is implemented with practical verification still open. R15 began with a three-region pilot; broader R15 coverage and R17 remain separate work. This learning sequence takes priority over remaining catalog expansion candidates. Prefer helping users apply existing coverage before increasing profile counts. Continue the R3 evidence-review backlog and outstanding Safari/touch verification alongside this work; these are existing quality obligations, not newly discovered regressions. No target dates are assigned. R15 vintage intelligence is independent and can proceed even if R16's Alko data gate fails; R17 links do not depend on the R16 data gate; superseded R18–R19 remain blocked until a permitted data feed exists. New R15–R19 plans do not alter completed releases.

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
- [x] Flight con…2762 tokens truncated… example. Do not infer precise blend, ABV, sugar, oak or drinking windows from an appellation alone.
- [x] Link relevant glossary definitions and explicitly represented alternatives; connect buying cues in R8 flights to this shared guidance.
- [x] Keep guidance useful for shops and restaurant lists without requiring live inventory, prices, commercial recommendations, label scanning or a backend.
- [x] Preserve source traceability and reviewed/limited evidence distinctions; leave unsupported fields absent rather than generating generic advice.

### Phylloxera and vineyard terminology

- [x] Add connected glossary entries for phylloxera, grafted/ungrafted/own-rooted vines, and pre-/post-phylloxera terminology. Explain susceptible roots and resistant/tolerant rootstocks using authoritative viticulture sources; grafting does not mean the wine is a blend of rootstock and fruiting varieties.
- [x] Distinguish wine actually made before a local outbreak, vines demonstrably surviving from that period, and modern wine from ungrafted vines. Ungrafted does not establish vine age; there is no single worldwide pre-/post-phylloxera cutoff. Check what a producer means rather than treating the phrase as a universal classification.
- [x] Add one or two concise “Why this vineyard matters” examples attached to documented parcels/bottlings, such as Quinta do Noval Nacional or Bollinger Vieilles Vignes Françaises after current claim review. Do not label a whole region phylloxera-free from one surviving parcel.
- [x] Keep the atlas’s style model unchanged: no pre-phylloxera wine family, automatic quality bonus, purity claim or promised universal flavour fingerprint. Teach why the distinction matters to history and vineyard practice, and what it cannot establish about taste.

### Acceptance criteria

- [x] Each pilot case explains what to look for, what the cue establishes, what it does not establish and when more information is needed.
- [x] A user can connect example label wording to the correct represented expression or an explicit coverage limitation.
- [x] No guide implies that a familiar appellation guarantees one sweetness, blend, oak treatment or exact sensory score.
- [x] Legal/category claims have direct, dated authoritative references with their jurisdiction and review scope recorded.
- [x] Shared guidance stays consistent across profiles, flights, glossary and search; existing URLs and search identities remain stable.
- [x] Optional sections are omitted cleanly when guidance is missing; native disclosure and glossary return focus are covered in DOM checks.
- [ ] Verify readable mobile layout, touch and real screen-reader behavior on devices.
- [x] Run existing validation and focused checks for guidance references, links, optional rendering and representative ambiguous label cases.
- [x] Published desktop Chrome: Chablis disclosure and readable layout, Bordeaux alternative route/focus, pre-/post-phylloxera examples in glossary, and clean omission on Napa checked after Pages deployment. Final lead-in wording also clarified to distinguish printed wording from confirmed producer information.

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

**Status:** Implemented 2026-10-25 as an optional guide in the shared learning dialog, opened from Explore → Discover. R13 blind practice follows; physical-device verification remains open.

**Goal:** Explain historical production through techniques that help wine lovers understand today’s bottles, without adding a historical-wine database.

### Scope

- [x] Create one optional guide of approximately 600–900 words, with three compact stories: Georgia, ancient Greece and Rome. For each use “what they did → why → what differs today → what survives”. Keep dates/regions specific; none is a single uniform ancient method.
- [x] Georgian story: distinguish archaeological evidence for early grape wine from documented later/living qvevri traditions. Explain clay vessels and skin contact with regional variation; do not claim an unchanged recipe over millennia or equate every qvevri wine with amber wine.
- [x] Greek story: review evidence for making, storage, transport, preservation and serving practices in a defined period. Discuss resin/amphorae where supported; distinguish drinking customs from fermentation and avoid presenting every Greek wine as resinated or sweet.
- [x] Roman story: pressing, large fermentation/storage vessels such as dolia, and production/distribution. Separate archaeological/textual findings from experimental reconstructions or inferred sensory possibilities. Do not claim that a modern clay wine reproduces one definitive Roman taste.
- [x] Link relevant existing glossary terms (qvevri, amphora, skin contact, oxidation and grafting/phylloxera as appropriate) and Georgian profiles. Place the guide in optional learning/reference material, outside the primary tasting sequence. Add glossary terms only when needed for the guide.
- [x] Use archaeology publications, museum/university research, documented primary texts and living-tradition sources with dated review scope. Preserve the distinction between evidence and interpretation in ordinary language. Do not copy proprietary maps, artwork or book passages.

### Acceptance and boundaries

- [x] Each story connects a historical practice to a useful modern production concept without a simplistic ancient-bad/modern-good or ancient-pure/modern-artificial progression.
- [x] The guide stays within the compact scope: no new historical profiles, fabricated tasting scores, comprehensive timeline, producer catalog or promised ancient flavour recreation.
- [x] Readers can open and leave the guide with accessible controls and useful return context; check links, phone/tablet readability, keyboard, screen readers and physical Safari/touch, recording unverified environments honestly.


Implementation: the `historyGuide` template in `index.html` contains three sourced stories and links to existing profiles; `learning.js` opens it in the shared glossary/taste dialog and handles profile links. Follow-ups replaced the separate page with this modal for consistent layout and controls, then moved the three reference lists into one collapsed sources section and styled links for readable contrast. Automated validation passes; actual iPhone/iPad Safari, physical touch, screen reader and browser layout checks remain unverified.

## R13 — Taste Before the Reveal

**Status:** Implemented 2026-10-25 as optional blind practice; novice, physical-device and screen-reader verification remain open.

**Goal:** Provide optional blind practice that rewards observation and reasoned hypotheses, with regional recognition as an advanced stretch goal.

**Depends on:** R11/R12. Complete R10 and review selected teaching profiles before using regional/bottle-selection challenges as answer material.

### Scope

- [x] Separate Learn (identities visible), Practice (cues optional) and Blind (sample identities withheld) with clear labels. Reuse the existing catalog/model; do not relabel the current named flights as blind.
- [x] Give a host/self-setup workflow for real bottles: neutral A/B/C codes, concealed labels, recorded actual bottle/vintage and an explicit reveal. Explain that an app cannot taste or verify the bottle in front of the learner.
- [x] Offer a neutral observation sheet and screen. Withhold grape/place/expected notes from normal pre-reveal titles, links, URLs, accessibility labels and printed output. Use a neutral challenge route; hiding identities is a teaching aid, not anti-cheat security for public static data.
- [x] Progress from broad structural/style contrasts and known references to a small announced candidate set; then consider grape/style hypotheses and finally region. Open-ended exact-region guesses are optional advanced practice.
- [x] Ask for several observed clues, at least one plausible alternative and confidence. Permit insufficient evidence; never map one fruit note, a soil descriptor or an editorial score directly to a region.
- [x] Reveal the actual selected bottle information and explain compatible/conflicting clues, overlap, confounders and uncertainty. Distinguish a correct closed-set guess from evidence of general regional mastery.
- [x] Keep participation optional and notes ephemeral/printable by default. Do not add accounts, hidden telemetry, mandatory rankings or a persistent personal notebook under this scope.

### Acceptance criteria

- [x] A partner can set up a genuine blind sample; a learner can record observations before identity/expected notes are exposed, then reveal and review the actual sample information.
- [ ] Automated DOM/navigation checks cover identity leakage and A/B mapping; native browser print and assistive-technology checks remain open. Reload intentionally discards the mapping and restarts host setup.
- [x] Regional practice uses a defined reviewed candidate set, multiple clues, alternatives and uncertainty. No region-identification accuracy or completion guarantee is claimed without evidence.
- [ ] A novice usability trial checks setup, observation, reveal and feedback separately from knowledge questions. Physical iPhone/iPad Safari, keyboard, screen readers and enlarged text are checked and unresolved issues remain explicit.


Implementation: `blind-practice.js` is a tab-memory-only host/learner exercise inside the existing journey. It provides a broad style set and a reviewed Pinot Noir candidate set; host mapping and actual bottle/vintage are removed from the learner DOM until explicit reveal. The neutral route and print styling keep identities out of normal pre-reveal content. Automated regression covers setup, navigation, observation gate, A/B mapping, reveal and reset. Browser print, novice learning and physical Safari/touch/screen-reader checks remain unverified.

## R15 — Vintage Weather Intelligence (independent)

**Status:** Three-region pilot implemented 2026-10-25; wider coverage and manual device/usability checks remain open. No Alko dependency. See [R15 pilot](docs/vintage-weather-r15.md). The bottle-level vintage badge and older-bottle items below are dormant: R17 links carry no bottle or vintage data, so they apply only if a permitted bottle feed exists later.

**Goal:** Explain how observed growing-season weather around a represented wine region and vintage may influence grapes and plausible wine style, without presenting a deterministic tasting prediction.

### Scope
- [ ] Audit existing profile geographic granularity; attach reviewed representative coordinates/region areas only where warranted. Never imply estate-level weather from a broad regional proxy; disclose location and resolution.
- [x] Select and document a historical weather source (Open-Meteo/ERA5-Land candidate), license, reproducibility, coverage limits and historic baseline. Cache data per region/subregion and vintage, rather than per bottle.
- [ ] Precompute supported regional vintages from **2000 onward** by default. Let the automation append new vintages after a region-appropriate growing/harvest season and a documented source-data maturity check; use provisional/final labels when justified. Never tie updates to a fixed global year-end date.
- [ ] Treat vintages **before 2000** as opt-in exceptions: if a verified Alko bottle (or a future explicit user request) refers to one, retrieve and cache that region/year only where historical data quality permits. Avoid bulk pre-2000 backfills; do not make Alko a dependency for normal coverage.
- [x] Keep vintage insights progressive-disclosure-first: compact collapsed `Vintage weather` control on eligible profiles; no expanded chronology by default. Present a concise year-specific summary only when requested, with optional further detail (weather measures, evidence and limitations). Limit default year choices to a small useful recent range; older cached years are discoverable through deliberate selection, not a long list.
- [x] Calculate defensible growing-season indicators (temperature anomalies, heat extremes, precipitation, growing-degree measures if justified); account for hemispheric harvest seasons and vintage-year conventions.
- [x] Produce concise reader-facing narrative: **observed conditions → possible vine/ripening effects → cautious sensory implications**. Avoid universal hot-year = better/riper wine conclusions; identify unknowns such as altitude, water access, grape, harvest timing and winemaking.
- [x] Add a nonintrusive optional vintage selector/context on existing represented wine styles; show no claim where vintage/geography is unsupported or confidence is insufficient.
- [ ] Design a reusable optional bottle-level vintage badge for eventual Alko integration: visible **2022 · Vintage context** (example) links to the same regional/year analysis, with clear statement that it is **not a bottle tasting review**.
- [ ] If an older Alko bottle invokes pre-2000 data, keep the explanation collapsed and clearly mark sparse/unavailable historical weather rather than inventing a vintage story. Use the same shared regional cache, avoiding one API request per bottle.
- [x] Keep calculations and precomputed content reusable across profiles and retailers; keep site functional when weather refreshes fail.

### Acceptance criteria
- [x] Historical weather interpretation operates with **zero Alko products or API credentials**.
- [ ] 2000+ is the default precomputed historical coverage; an older bottle never triggers a global backfill. New vintage releases are calendar/data-driven and are not tied to annual feature releases.
- [x] Profile view remains uncluttered: vintage details are collapsed until requested and do not show hundreds of years or empty placeholders.
- [ ] Different hemispheres and vintages use correct growing seasons; nearby regions are not represented as identical microclimates.
- [x] Source, geography, baseline, data date and limitations are traceable; tests prevent unsupported numeric/taste assertions.
- [ ] Screen-reader and mobile interactions work; missing weather leaves normal profile content unaffected.


Pilot notes: cached ERA5 2000+ seasons for Sancerre, Marlborough and Central Otago only. A follow-up leads with cautious grape-specific sensory hypotheses and puts numeric weather behind a disclosure. The 60-day region-specific maturity rule yields 2025 as latest Northern and 2026 as latest Southern year on 2026-10-25. Broader proxy review, a future bottle badge, native browser/device checks and a reviewable recurring refresh PR remain open. No Alko data or live browser API requests.

## R16 — Alko Data Feasibility Gate (Alko-dependent)

**Status:** Research gate assessed 2026-10-25: **provisional NO-GO** for pulling Alko data. This no longer blocks R17, which only links to Alko's own search pages, see [R16 feasibility](docs/alko-feasibility-r16.md). No permitted source or terms were found, alko.fi could not be reached for first-hand verification, and no prototype was run. An Alko data feed and superseded R18–R19 remain blocked until Alko confirms access in writing; R17 plain search links are independent. Do not begin production catalog/availability promises until this passes.

- [ ] Verify an authorized and maintainable source for product identifiers, direct product URLs, bottle name, vintage, grape/blend, country, region/appellation, EUR price and **store-level plus online-orderable availability**. Check terms, licensing, access requirements, rate limits, permitted display/retention and update cadence.
- [x] (definition proposed; data access unverified) Establish what “available” means and whether online orderability and store-stock data can be obtained with reliable timestamps. Product listing alone does **not** establish availability.
- [ ] Prototype a small read-only extraction; inspect field quality, incomplete blends, inconsistent region names, source schema changes and stock accuracy. Document a source adapter contract so the frontend never depends on Alko's raw format.
- [ ] If permitted data cannot be obtained or required fields cannot be verified, mark any Alko data feed **blocked** (the old bottle-discovery plan, now superseded), do not scrape around restrictions, and proceed with R15 independently.
- [ ] Set minimum required freshness and validate whether scheduled refresh rates are adequate. Weekly price/catalog review and more frequent stock verification may be separate tasks.

**Exit criterion:** Documented go/no-go (documented as provisional NO-GO on 2026-10-25; reopen when Alko confirms a permitted route) with permissions, representative test data, acceptable data quality and a supportable availability definition.

## R17 — Search at Alko Links

**Status:** Five checked-link batches implemented through 2026-10-26 for 35 profiles, including rosé, sparkling, sweet and Port examples; wider grape, style and region mapping remains open. See [R17 link checks](docs/alko-links-r17.md). Replaces the earlier bottle-discovery pilot (old R17–R19, in git history). The Atlas stores **no Alko product, price or stock data**: it only links to Alko's own filtered search pages. Does not depend on the R16 data gate.

**Observed URL scheme** (examples supplied by the project owner from alko.fi on 2026-10-25; observed, not documented or guaranteed by Alko):
- Category in the path: `/fi/tuotteet/punaviinit`, `valkoviinit`, `roseeviinit`, `kuohuviinit-ja-samppanjat`, `jalkiruokaviinit-ja-muut`.
- Filters as query parameters: `grapeId=grape_<name>` (e.g. `grape_cabernet_sauvignon`), `countryId=<ISO 3-letter>` (e.g. `CHL`), `regionId=<ISO3>_<finnish-slug>` (e.g. `FRA_bourgogne`, `ARG_mendoza`, `FRA_lounais-ranska`).
- Filters combine, e.g. `punaviinit?countryId=CHL&grapeId=grape_carmenere` and `punaviinit?regionId=FRA_bourgogne&grapeId=grape_pinot_noir`.
- Product pages (`/fi/tuotteet/<id>/<slug>`) show the normalized grape ID and are useful for checking IDs, but are **never linked**: products get delisted.

### Scope
- [x] Add `data/alko-links.json` for checked first-batch grape/category/country/region IDs; one guarded link-builder function builds every URL, with no URLs in profile data. Extend mappings in reviewed batches.
- [ ] Grapes first: derive the likely `grape_<name>` mapping, then confirm the uncertain ones (e.g. Grüner Veltliner, Albariño, Torrontés, Melon de Bourgogne) from Alko product pages. Blend and style profiles without a grape (port, champagne, provence rosé) link by category only.
- [ ] Grapes used in several styles (e.g. Pinot Noir: red, rosé, sparkling) offer the relevant category links; each is checked.
- [ ] Regions in later batches. **We do not know how Alko organizes regions, especially small niche areas.** Each region entry records one of: `verified` (checked, with date), `country-fallback` (Alko has no matching region; link by country and say so), or `none`. Only `verified` and `country-fallback` links display. Never guess a region slug. Label links by what they search ("Burgundy wines at Alko"), not as an exact appellation.
- [ ] Link text: **Search at Alko**. No prices, stock, availability, bottle names, discounts or ranking claims, and no wording that implies Alko stocks the wine. State that results are on Alko's site. Open normally; use `rel="noopener"` if opened in a new tab.
- [x] Place the section unobtrusively on mapped profile pages; show nothing without a checked mapping. Optional JSON failure leaves the profile intact.
- [x] Review the Finnish alcohol-marketing question flagged in [R16 feasibility](docs/alko-feasibility-r16.md) for this narrow, neutral search-link batch; no promotional framing. Legal interpretation remains unresolved for any future product/price displays.

### Validation (done later, manually)
- [x] First five batches: open all 31 distinct searches for 35 mapped profiles, confirm category, applicable grape, and region/country chips and plausible results; record date in `data/alko-links.json`. Repeat for every new mapping.
- [ ] Repeat the spot-check each release and whenever a link is reported broken. No automated requests to alko.fi from tests or GitHub Actions.
- [ ] If Alko changes the URL scheme, a one-file change in the link builder and config fixes all links.

### Tests
- [ ] URL shape: builder output matches the documented scheme; category is consistent with grape colour.
- [ ] Every profile either has a mapping or no link; no region link without a `verified`/`country-fallback` status.
- [ ] Forbidden wording (price, stock, available, in stock) does not appear in the Alko section.
- [ ] Section absent leaves profiles unchanged; `npm run validate` passes.

### Acceptance criteria
- [ ] Atlas stores and displays no Alko-sourced data beyond the generated links.
- [ ] Every displayed link has a recorded check date and does not claim more than the search it performs.
- [ ] Unknown or niche regions fall back to country or show no link, never a guessed region.
- [ ] Broken or changed Alko URLs cannot break the Atlas itself.

## R18 — Superseded

Alko catalog coverage and store selector were part of the earlier bottle-discovery plan. They need Alko stock data, which R16 could not confirm as permitted. Reopen only if Alko grants a data route. Original text is in git history before 2026-10-25.

## R19 — Superseded

Guarded auto-publishing of Alko data depended on a data feed. Not pursued; reopen only after a permitted feed exists. Original text is in git history before 2026-10-25.

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
