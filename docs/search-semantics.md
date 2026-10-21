# Search semantics — R1: Search with Meaning

Explore and Compare use the same `WineSearch` parser and ranking engine. Their result limits differ (10 and 12); interpretation and ordering are shared.

## Query policy

- Bare `rose` / `rosé` means rosé wine, including sparkling rosé. Bare `orange` / `amber` means white-grape skin-contact wine, not every amber-coloured fortified wine.
- `red` and `white` filter the displayed wine colour. Blanc de noirs is white despite its red grape; golden sweet whites remain white.
- `sparkling`, `still`, `fortified` and named appellations constrain the represented expression. Independent constraints are combined with AND; contradictory requests return no matches.
- `dry`, `off-dry` / `semi-dry`, and `sweet` use explicit profile sweetness metadata first. For still profiles without that metadata, the existing editorial score anchors provide a temporary classification: 0–1 dry, above 1 and below 3 off-dry, 3–5 sweet. These are editorial bins, not legal residual-sugar definitions. R3 owns refinement of ambiguous modeled expressions.
- A profile declared `dry-to-off-dry` is included in `off-dry`, not in a guaranteed `dry` result. Prose such as “sweet oak” or “styles range from dry to sweet” does not override the modeled classification.
- `aroma: rose`, `aromas: orange` and `notes: orange` search values in Typical notes. Optional wine filters precede the marker, for example `dry aroma: rose`. Everything after the marker is sensory text, not a wine filter. An empty sensory query returns no matches.
- Wine/grape aliases and appellations are matched as whole phrases, longest first. Known canonical food pairings and food aliases are protected before interpreting wine words. `white pizza` and `sweet and sour pork` remain food searches; `white wine sweet and sour pork` also applies a white-wine constraint.
- Remaining identity terms use whole-token matching. If no exact textual result exists, the final token may complete a word in a grape/place identity, preserving useful type-ahead such as `cab`. Interior substrings do not match: `inot` does not find Pinot, and `port` does not find Portugal when actual Port identities match.
- Accent, case, punctuation, hyphen and apostrophe differences are normalized. Food aliases are optional bounded enrichment; pure wine and aroma queries do not wait for them. Food requests are reparsed after vocabulary loading so previously unknown dish aliases can be protected.

## Grape aliases and regional coverage

Aliases live on the existing canonical grape objects in `data/grapes.json`, with `aliasSources` pointing to entries in `data/sources.json`. Validation rejects empty, conflicting or unreferenced aliases. No canonical IDs or profile URLs change.

| Search alias | Canonical grape | Evidence |
| --- | --- | --- |
| Spätburgunder / Spaetburgunder | Pinot Noir | [Wines of Germany](https://winesofgermany.co.uk/grape/spatburgunder/) |
| Primitivo | Zinfandel | [UC Davis Foundation Plant Services](https://fps.ucdavis.edu/grapebook/winebook.cfm?chap=Zinfandel) |
| Alvarinho | Albariño | [UC Davis Foundation Plant Services variety registry](https://fps.ucdavis.edu/FGRfamilies.cfm?varietyid=170) |

Evidence checked 2026-10-20. Synonym identity does not imply identical clones, winemaking or regional styles.

An alias result states the canonical grape and dynamically lists countries whose expressions are actually represented. R5 batch A adds an actual Primitivo di Manduria DOC expression under the existing `zinfandel` ID. `Primitivo Italy` now selects that profile; `Primitivo Lodi` still selects the US expression. Notices report Italy and USA. Recognizing an alias does not imply that every Puglian appellation is covered.

R5 also adds structured production-class constraints for appassimento, precise appellation rules for the new expressions, and explicit unavailable-expression notices for Ripasso, Recioto, Primitivo Dolce Naturale and unrepresented Chablis levels. These return no substitute. See [batch A integration](familiar-names-batch-a.md).

Generic `muscat` / `moscato` resolves the represented Muscat grape family (Muscat Blanc and Muscat of Alexandria), across their represented regions and production styles. More specific names win: `Moscato Bianco` selects Muscat Blanc, and `Moscato d'Asti` remains constrained to its named sparkling expression. This is a family search, not a claim that the two Muscat varieties are synonyms.

## Verification

`tests/search-semantics.mjs` covers the original failures; colour/sweetness combinations; food protection; grape and regional constraints; aroma queries; synonyms and honest coverage notices; Muscat/appellation distinctions; actual Explore/Compare rendering parity; safe text rendering; and delayed food-vocabulary loading. Existing regression suites continue to cover appellations, food aliases, state transitions and optional-data failures.

Run `npm run validate`. Real-browser checks are still needed for visible behavior; jsdom does not establish iPhone/iPad Safari layout or interaction correctness.

## R5 batch B

Sherry/Jerez covers Fino, dry Oloroso and sweet PX; qualifiers filter those styles. Madeira models medium-sweet Boal only. Vinho Verde models dry still Alvarinho from Monção e Melgaço. Alvarinho country coverage now includes Portugal, Spain and Uruguay. Longer unsupported expressions return coverage notices rather than substitutes; see [batch scope](classic-families-batch-b.md). `white fortified` finds pale Fino; amber Oloroso/Madeira and brown PX retain their actual selected wine colour.

## R5 batch C

Adds precise everyday appellation coverage for Montepulciano d’Abruzzo, Sicilian Nero d’Avola, Jumilla Monastrell, Bierzo Mencía and young white Rioja. Monastrell/Mataró resolve to one Mourvèdre identity and report only represented country coverage. Viura retains shared identity with Macabeo: its dry Cava and still white Rioja expressions can both match generic grape queries. Exact Rioja excludes incidental mentions in Ribera prose. Tuscan Montepulciano appellations and selected unrepresented styles have no-substitute notices. See [batch C](everyday-coverage-batch-c.md).
